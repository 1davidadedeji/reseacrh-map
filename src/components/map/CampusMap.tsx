"use client";

import { useRef, useEffect, useCallback } from "react";
import maplibregl, {
  type ExpressionSpecification,
  type PaddingOptions,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  bbox, bboxPolygon, booleanClockwise, booleanIntersects, buffer,
  concave, convex, explode, featureCollection, point, polygonSmooth, union,
} from "@turf/turf";
import type { Building } from "@/types";
import type { GeoJsonBuildingMeta } from "@/types/building-selection";

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? "";

// MapTiler minimal light basemap. If dataviz-light ever becomes unavailable
// on the plan, swap for: /maps/positron/style.json
const MAP_STYLE = `https://api.maptiler.com/maps/dataviz-light/style.json?key=${MAPTILER_KEY}`;

const SOURCE_ID        = "campus-buildings";
const SATELLITE_SOURCE = "satellite";
const MASK_SOURCE      = "satellite-mask";
const ZONES_SOURCE     = "satellite-zones";
const PINS_SOURCE      = "building-pins";

const LAYER_SATELLITE     = "satellite-layer";
const LAYER_MASK          = "satellite-mask-layer";
const LAYER_ZONE_OUTLINE  = "satellite-zones-outline";
const LAYER_LABELS        = "buildings-labels";
const LAYER_PINS          = "pins-layer";
const LAYER_PINS_SELECTED = "pins-layer-selected";

const PIN_IMAGE          = "uapb-pin";
const PIN_IMAGE_SELECTED = "uapb-pin-selected";

// Satellite + mask sit ABOVE the basemap's road layers (so no road lines
// render over the campus imagery) and below its symbol/label layers. Outside
// the zones the opaque mask therefore covers roads too: at 0.92 they faintly
// ghost through the mask; flip to 1.0 for the clean-paper look (no roads
// outside campus at all).
const MASK_OPACITY = 0.92;

const INITIAL_CENTER: [number, number] = [-92.02184, 34.24382];
const INITIAL_ZOOM        = 15;
const BUILDING_FOCUS_ZOOM = 18;
const LABEL_MIN_ZOOM      = 15.5;

// Fallback framing used until the campus zone is computed from building
// footprints on first load (getMaskZones updates campusFitBounds).
const CAMPUS_BOUNDS_FALLBACK: [[number, number], [number, number]] = [
  [-92.0250, 34.2400],
  [-92.0170, 34.2530],
];
let campusFitBounds = CAMPUS_BOUNDS_FALLBACK;

const WORLD_RING: [number, number][] = [
  [-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85],
];

// Off-campus research sites revealed through the satellite mask. Each point
// is buffered by `radius` meters into a rounded satellite island — add future
// sites here. Zones that end up overlapping (each other or the campus hull)
// are automatically unioned into a single island by dissolveOverlaps().
const OFF_CAMPUS_SITES = [
  { id: "econ-dev-center",    name: "Economic Development Center",
    lng: -92.0031, lat: 34.2233, radius: 120 },
  { id: "ag-tech-center",     name: "Agricultural Technology & Training Center",
    lng: -92.0273, lat: 34.2527, radius: 150 },
  { id: "parker-ag-research", name: "S.J. Parker Agricultural Research Centre",
    lng: -92.0242, lat: 34.2525, radius: 150 },
];

const LEFT_PANEL_W    = 288;
const LEFT_COLLAPSED_W = 48;
const RIGHT_SIDEBAR_W = 320;
const MAP_UI_BOTTOM   = 100;

const PIN_GOLD          = "#EEB310";
const PIN_GOLD_SELECTED = "#C8960A";

// ── Pin SVG geometry (28 × 34) ─────────────────────────────────────────────────
// Circle head: r=11 centered at (14,13).  Tip at (14,33) → anchor: "bottom" puts
// the tip exactly on the building centroid.
const PIN_W    = 28;
const PIN_H    = 34;
const PIN_PATH = "M14 33C8 24 3 20 3 13A11 11 0 1 1 25 13C25 20 20 24 14 33Z";
// Columned-building icon inside circle (pediment + 3 columns + base)
const ICON_PATH = "M7 13L14 7L21 13M7 13h14M9 13v7M14 13v7M19 13v7M7 20h14";

interface CampusMapProps {
  buildings: Building[];
  selectedId: string | null;
  onSelectBuilding: (id: string, meta?: GeoJsonBuildingMeta) => void;
  leftPanelCollapsed?: boolean;
  rightSidebarOpen?: boolean;
}

// ── Orientation ────────────────────────────────────────────────────────────────

function getOrientationBearing(): number {
  if (typeof window === "undefined") return 0;
  // Campus rectangle is portrait; rotate -90° on landscape screens so it
  // fills the horizontal viewport instead of leaving dead space.
  return window.innerWidth > window.innerHeight ? -90 : 0;
}

// ── Layout / camera helpers ────────────────────────────────────────────────────

function buildMapPadding(lc: boolean, rs: boolean): PaddingOptions {
  return {
    left:   (lc ? LEFT_COLLAPSED_W : LEFT_PANEL_W) + 24,
    top:    20,
    right:  (rs ? RIGHT_SIDEBAR_W : 0) + 56,
    bottom: MAP_UI_BOTTOM,
  };
}

function fitCampusView(map: maplibregl.Map, padding: PaddingOptions, animate = true) {
  try {
    map.fitBounds(campusFitBounds, {
      padding,
      pitch:   0,
      bearing: getOrientationBearing(),
      duration: animate ? 700 : 0,
      maxZoom:  17.5,
    });
  } catch { /* ignore during teardown */ }
}

function isMapReady(map: maplibregl.Map | null): map is maplibregl.Map {
  if (!map) return false;
  try { return Boolean(map.getContainer()?.isConnected) && Boolean(map.isStyleLoaded()); }
  catch { return false; }
}

// ── GeoJSON helpers ────────────────────────────────────────────────────────────

function buildingMetaFromFeature(f: GeoJSON.Feature): GeoJsonBuildingMeta | null {
  const p = f.properties;
  if (!p) return null;
  const id = p.building_id as string | undefined;
  if (!id) return null;
  return { id, name: String(p.name ?? id), code: String(p.code ?? "") };
}

function ringCentroid(ring: number[][]): [number, number] | null {
  let n = ring.length;
  if (n === 0) return null;
  const [f, l] = [ring[0], ring[n - 1]];
  if (n > 1 && f[0] === l[0] && f[1] === l[1]) n -= 1;
  if (n === 0) return null;
  let lng = 0, lat = 0;
  for (let i = 0; i < n; i++) { lng += ring[i][0]; lat += ring[i][1]; }
  return [lng / n, lat / n];
}

function centroidFromFeature(f: GeoJSON.Feature): [number, number] | null {
  const g = f.geometry;
  if (g.type === "Polygon")      return ringCentroid(g.coordinates[0]);
  if (g.type === "MultiPolygon") return ringCentroid(g.coordinates[0][0]);
  return null;
}

// ── Map layer builders ─────────────────────────────────────────────────────────

function satelliteTileURL(): string | null {
  if (!MAPTILER_KEY) return null;
  return `https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`;
}

// Insertion point that keeps satellite + mask above every road/line layer
// (no basemap roads over the campus imagery) but below the basemap's
// symbol/label layers: the first symbol layer in the loaded style.
function findSatelliteInsertPoint(map: maplibregl.Map): string | undefined {
  return (map.getStyle()?.layers ?? []).find((l) => l.type === "symbol")?.id;
}

function basemapBackgroundColor(map: maplibregl.Map): string {
  const bg = (map.getStyle()?.layers ?? []).find((l) => l.type === "background");
  if (bg) {
    const c = map.getPaintProperty(bg.id, "background-color");
    if (typeof c === "string") return c;
    // Zoom-interpolated background color expression: take the
    // highest-zoom color stop
    if (Array.isArray(c)) {
      const colors = (c as unknown[]).filter(
        (v): v is string => typeof v === "string" && /^(#|rgb|hsl)/.test(v)
      );
      if (colors.length) return colors[colors.length - 1];
    }
  }
  return "#f8f8f6";
}

// ── Satellite mask zones (computed once from building footprints) ──────────────

type Zone = GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;

// Concave hull of every building vertex, buffered 40 m and smoothed.
// maxEdge starts tight (0.2 km hugs building clusters instead of bridging
// across the forest east of campus) and steps up 0.05 until concave() yields
// a single clean polygon instead of null / MultiPolygon fragments — 0.25 km
// with the current data.
function computeCampusZone(geojson: GeoJSON.FeatureCollection): Zone {
  const points = explode(geojson);
  let hull: Zone | null = null;
  for (let step = 0; step <= 5; step++) {
    const h = concave(points, { maxEdge: 0.2 + step * 0.05, units: "kilometers" });
    if (h && h.geometry.type === "Polygon") { hull = h; break; }
  }
  hull ??= convex(points);
  const base: Zone = hull ?? bboxPolygon(bbox(geojson));
  const buffered = buffer(base, 40, { units: "meters" }) ?? base;
  return polygonSmooth(buffered, { iterations: 2 }).features[0] ?? buffered;
}

function computeOffCampusZones(): Zone[] {
  const byId = new Map<string, Zone>();
  for (const s of OFF_CAMPUS_SITES) {
    const zone = buffer(point([s.lng, s.lat], { site_id: s.id, name: s.name }),
      s.radius, { units: "meters" });
    if (zone) byId.set(s.id, zone);
  }
  // The two Oliver Rd sites are ~300 m apart — merge them into one zone
  const agTech = byId.get("ag-tech-center");
  const parker = byId.get("parker-ag-research");
  if (agTech && parker) {
    const merged = union(featureCollection([agTech, parker]));
    if (merged) {
      byId.delete("parker-ag-research");
      byId.set("ag-tech-center", merged);
    }
  }
  return [...byId.values()];
}

// Overlapping hole rings make the mask polygon invalid (even-odd fill re-fills
// the overlap), so any zones that touch are unioned into one island first.
function dissolveOverlaps(zones: Zone[]): Zone[] {
  const out: Zone[] = [];
  for (let zone of zones) {
    for (let i = out.length - 1; i >= 0; i--) {
      if (booleanIntersects(out[i], zone)) {
        zone = union(featureCollection([out[i], zone])) ?? zone;
        out.splice(i, 1);
      }
    }
    out.push(zone);
  }
  return out;
}

// Outer ring of every zone polygon, wound clockwise — opposite the CCW world
// ring — so each punches a hole through the mask.
function zoneHoleRings(zones: Zone[]): GeoJSON.Position[][] {
  const rings: GeoJSON.Position[][] = [];
  for (const zone of zones) {
    const polys = zone.geometry.type === "Polygon"
      ? [zone.geometry.coordinates]
      : zone.geometry.coordinates;
    for (const poly of polys) {
      const outer = poly[0];
      rings.push(booleanClockwise(outer) ? outer : [...outer].reverse());
    }
  }
  return rings;
}

interface MaskZones {
  zones:     Zone[];
  holeRings: GeoJSON.Position[][];
}

let cachedMaskZones: MaskZones | null = null;

function getMaskZones(geojson: GeoJSON.FeatureCollection): MaskZones {
  if (cachedMaskZones) return cachedMaskZones;
  const campusZone = computeCampusZone(geojson);
  const [w, s, e, n] = bbox(campusZone);
  campusFitBounds = [[w, s], [e, n]];
  const zones = dissolveOverlaps([campusZone, ...computeOffCampusZones()]);
  cachedMaskZones = { zones, holeRings: zoneHoleRings(zones) };
  return cachedMaskZones;
}

// ── Satellite + mask layers ────────────────────────────────────────────────────

function addSatelliteWithMask(map: maplibregl.Map, holeRings: GeoJSON.Position[][]) {
  if (map.getSource(SATELLITE_SOURCE)) return;
  const tileURL = satelliteTileURL();
  if (!tileURL) return;

  const beforeId = findSatelliteInsertPoint(map);

  map.addSource(SATELLITE_SOURCE, { type: "raster", tiles: [tileURL], tileSize: 512, maxzoom: 20 });
  map.addLayer({ id: LAYER_SATELLITE, type: "raster", source: SATELLITE_SOURCE }, beforeId);

  // Mask: world polygon with zone-shaped holes, painted in the basemap
  // background color directly above the satellite layer. Outside the holes
  // it hides the satellite AND the road layers below it (see MASK_OPACITY);
  // inside the zones the satellite shows through with no roads drawn on top.
  map.addSource(MASK_SOURCE, {
    type: "geojson",
    data: {
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [WORLD_RING, ...holeRings] },
      properties: {},
    },
  });
  map.addLayer({
    id: LAYER_MASK, type: "fill", source: MASK_SOURCE,
    paint: { "fill-color": basemapBackgroundColor(map), "fill-opacity": MASK_OPACITY },
  }, beforeId);
}

// Gold sketched outline around every satellite island
function addZoneOutlines(map: maplibregl.Map, zones: Zone[]) {
  if (map.getSource(ZONES_SOURCE)) return;
  map.addSource(ZONES_SOURCE, { type: "geojson", data: featureCollection(zones) });
  map.addLayer({ id: LAYER_ZONE_OUTLINE, type: "line", source: ZONES_SOURCE,
    paint: { "line-color": "#C8960A", "line-width": 2, "line-opacity": 0.5 } });
}

function addBuildingSource(map: maplibregl.Map, geojson: GeoJSON.FeatureCollection) {
  if (map.getSource(SOURCE_ID)) return;
  map.addSource(SOURCE_ID, { type: "geojson", data: geojson, promoteId: "building_id" });
  map.addLayer({
    id: LAYER_LABELS, type: "symbol", source: SOURCE_ID, minzoom: LABEL_MIN_ZOOM,
    layout: {
      "text-field":            ["get", "name"],
      // Size interpolates 10px → 14px as you zoom from 15.5 → 18
      "text-size":             ["interpolate", ["linear"], ["zoom"], 15.5, 10, 18, 14] as ExpressionSpecification,
      "text-font":             ["Open Sans SemiBold", "Arial Unicode MS Regular"],
      // Variable anchor lets GL reposition labels to avoid collisions
      "text-variable-anchor":  ["top", "bottom", "left", "right"],
      "text-radial-offset":    1.2,
      "text-allow-overlap":    false,
      "text-ignore-placement": false,
      "symbol-avoid-edges":    true,
    },
    paint: { "text-color": "#ffffff", "text-halo-color": "#1a1a1a", "text-halo-width": 1.5 },
  });
}

function focusBuilding(
  map:       maplibregl.Map,
  id:        string,
  centroids: Map<string, [number, number]>,
  padding:   PaddingOptions,
  animate    = true,
) {
  const coord = centroids.get(id);
  if (!coord || !Number.isFinite(coord[0]) || !Number.isFinite(coord[1])) return;
  try {
    map.flyTo({
      center:  coord,
      zoom:    BUILDING_FOCUS_ZOOM,
      pitch:   0,
      bearing: map.getBearing(), // preserve current orientation
      padding,
      duration: animate ? 900 : 0,
    });
  } catch { /* teardown */ }
}

// ── Tooltip ────────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderTooltipBody(meta: GeoJsonBuildingMeta, building: Building | null): string {
  const header = building?.image_url
    ? `<div style="margin:-12px -12px 10px;height:90px;overflow:hidden;border-radius:10px 10px 0 0;">
         <img src="${esc(building.image_url)}" alt="" style="width:100%;height:100%;object-fit:cover;" loading="lazy"/>
       </div>`
    : `<div style="margin:-12px -12px 10px;height:52px;background:#f8f6f0;border-radius:10px 10px 0 0;display:flex;align-items:center;justify-content:center;">
         <svg width="20" height="20" viewBox="0 0 28 34" fill="none" stroke="${PIN_GOLD_SELECTED}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
           <path d="${ICON_PATH}"/>
         </svg>
       </div>`;

  const desc = building?.description
    ? `<p style="margin:4px 0 0;font-size:11px;color:#555;line-height:1.4;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${esc(building.description)}</p>`
    : "";

  const details: string[] = [];
  if (building?.floors)     details.push(`${building.floors} floors`);
  if (building?.year_built) details.push(`Est. ${building.year_built}`);
  const detailLine = details.length
    ? `<p style="margin:3px 0 0;font-size:10px;color:#aaa;">${details.join(" · ")}</p>` : "";

  return `${header}
    <p style="margin:0;font-weight:700;font-size:13px;color:#111;line-height:1.3;">${esc(meta.name)}</p>
    ${meta.code ? `<p style="margin:2px 0 0;font-size:10px;color:#999;font-family:monospace;letter-spacing:.04em;">${esc(meta.code)}</p>` : ""}
    ${desc}${detailLine}
    <p style="margin:8px 0 0;font-size:10px;color:${PIN_GOLD};font-weight:600;">View research →</p>`;
}

// ── Native pin symbol layers ───────────────────────────────────────────────────
//
// Pins are native symbol layers, not HTML markers: symbols are glued to their
// coordinate at every zoom (displacement is impossible) and the collision
// engine hides crowded pins at low zoom, bringing them back as you zoom in.

// Rasterize the teardrop pin SVG for map.addImage (drawn at 2x for pixelRatio: 2)
function makePinImage(fill: string, scale = 1): Promise<HTMLImageElement> {
  const w = Math.round(PIN_W * 2 * scale);
  const h = Math.round(PIN_H * 2 * scale);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${PIN_W} ${PIN_H}">` +
    `<path d="${PIN_PATH}" fill="${fill}" stroke="#1a1a1a" stroke-width="1.5" stroke-linejoin="round"/>` +
    `<path d="${ICON_PATH}" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>` +
    `</svg>`;
  return new Promise((resolve, reject) => {
    const img = new Image(w, h);
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

function buildPinFeatureCollection(
  geojson: GeoJSON.FeatureCollection,
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  const features: GeoJSON.Feature<GeoJSON.Point>[] = [];
  for (const f of geojson.features) {
    const meta  = buildingMetaFromFeature(f);
    const coord = meta ? centroidFromFeature(f) : null;
    if (!meta || !coord) continue;
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: coord },
      properties: {
        building_id: meta.id,
        name:        meta.name,
        code:        meta.code,
        priority:    (f.properties?.priority as number | undefined) ?? null,
      },
    });
  }
  return { type: "FeatureCollection", features };
}

const PIN_ICON_SIZE: ExpressionSpecification =
  ["interpolate", ["linear"], ["zoom"], 13, 0.5, 15, 0.8, 16.5, 1.0];
// Lower sort key wins collisions; buildings with a `priority` property beat
// the rest (none in the data yet — activates automatically when added)
const PIN_SORT_KEY: ExpressionSpecification = ["coalesce", ["get", "priority"], 999];

function addPinLayers(map: maplibregl.Map, geojson: GeoJSON.FeatureCollection) {
  if (map.getSource(PINS_SOURCE)) return;
  map.addSource(PINS_SOURCE, { type: "geojson", data: buildPinFeatureCollection(geojson) });

  map.addLayer({
    id: LAYER_PINS, type: "symbol", source: PINS_SOURCE,
    filter: ["!=", ["get", "building_id"], ""],
    layout: {
      "icon-image":         PIN_IMAGE,
      "icon-anchor":        "bottom",   // teardrop tip on the centroid
      "icon-size":          PIN_ICON_SIZE,
      "icon-allow-overlap": false,      // crowded pins auto-hide, reappear on zoom-in
      "symbol-sort-key":    PIN_SORT_KEY,
    },
  });

  // Selected building: darker 1.15x pin on its own always-visible layer
  map.addLayer({
    id: LAYER_PINS_SELECTED, type: "symbol", source: PINS_SOURCE,
    filter: ["==", ["get", "building_id"], ""],
    layout: {
      "icon-image":            PIN_IMAGE_SELECTED,
      "icon-anchor":           "bottom",
      "icon-size":             PIN_ICON_SIZE,
      "icon-allow-overlap":    true,
      "icon-ignore-placement": true,
    },
  });
}

// Selection is a filter swap: the selected pin moves from the base layer to
// the darker selected layer, so the two images never draw on top of each other
function syncPinSelection(map: maplibregl.Map, selectedId: string | null) {
  if (!map.getLayer(LAYER_PINS)) return;
  try {
    map.setFilter(LAYER_PINS,          ["!=", ["get", "building_id"], selectedId ?? ""]);
    map.setFilter(LAYER_PINS_SELECTED, ["==", ["get", "building_id"], selectedId ?? ""]);
  } catch { /* teardown */ }
}

function attachPinInteractions(
  map:         maplibregl.Map,
  onSelect:    (id: string, meta: GeoJsonBuildingMeta) => void,
  getBuilding: (id: string) => Building | null,
) {
  const popup = new maplibregl.Popup({
    closeButton: false, closeOnClick: false,
    anchor: "bottom", offset: [0, -(PIN_H + 6)],
    maxWidth: "230px", className: "building-pin-popup",
  });

  for (const layerId of [LAYER_PINS, LAYER_PINS_SELECTED]) {
    map.on("click", layerId, (e) => {
      const f = e.features?.[0];
      const meta = f ? buildingMetaFromFeature(f) : null;
      if (meta) onSelect(meta.id, meta);
    });

    map.on("mouseenter", layerId, (e) => {
      map.getCanvas().style.cursor = "pointer";
      const f = e.features?.[0];
      const meta = f ? buildingMetaFromFeature(f) : null;
      if (!f || !meta) return;
      const coord = (f.geometry as GeoJSON.Point).coordinates as [number, number];
      popup
        .setLngLat(coord)
        .setHTML(`<div style="padding:12px;width:210px;font-family:system-ui,-apple-system,sans-serif;">${renderTooltipBody(meta, getBuilding(meta.id))}</div>`)
        .addTo(map);
    });

    map.on("mouseleave", layerId, () => {
      map.getCanvas().style.cursor = "";
      popup.remove();
    });
  }
}

// ── GeoJSON cache ──────────────────────────────────────────────────────────────

let cachedGeojson: GeoJSON.FeatureCollection | null = null;

async function loadCampusGeojson() {
  if (!cachedGeojson) {
    const res = await fetch("/buildings.geojson");
    cachedGeojson = (await res.json()) as GeoJSON.FeatureCollection;
  }
  const centroids = new Map<string, [number, number]>();
  for (const f of cachedGeojson.features) {
    const id = f.properties?.building_id as string | undefined;
    if (!id) continue;
    const c = centroidFromFeature(f);
    if (c) centroids.set(id, c);
  }
  return { geojson: cachedGeojson, centroids };
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function CampusMap({
  buildings,
  selectedId,
  onSelectBuilding,
  leftPanelCollapsed = false,
  rightSidebarOpen   = false,
}: CampusMapProps) {
  const containerRef      = useRef<HTMLDivElement>(null);
  const mapRef            = useRef<maplibregl.Map | null>(null);
  const layersReadyRef    = useRef(false);
  const prevSelectedIdRef = useRef<string | null>(null);
  const centroidsRef      = useRef<Map<string, [number, number]>>(new Map());
  const paddingRef        = useRef(buildMapPadding(leftPanelCollapsed, rightSidebarOpen));
  const buildingsMapRef   = useRef<Map<string, Building>>(new Map());

  paddingRef.current = buildMapPadding(leftPanelCollapsed, rightSidebarOpen);

  const onSelectRef = useRef(onSelectBuilding);
  onSelectRef.current = onSelectBuilding;

  useEffect(() => {
    buildingsMapRef.current = new Map(buildings.map((b) => [b.id, b]));
  }, [buildings]);

  const resizeMap = useCallback(() => {
    const map = mapRef.current;
    if (!isMapReady(map)) return;
    try { map.resize(); } catch { /* mid-teardown */ }
  }, []);

  // ── Initialize map once ────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    let cancelled = false;

    const map = new maplibregl.Map({
      container,
      style:   MAP_STYLE,
      center:  INITIAL_CENTER,
      zoom:    INITIAL_ZOOM,
      pitch:   0,
      bearing: getOrientationBearing(),
    });

    mapRef.current       = map;
    layersReadyRef.current = false;

    const setupLayers = async () => {
      if (cancelled || !isMapReady(map)) return;
      const [{ geojson, centroids }, [pinImg, pinSelectedImg]] = await Promise.all([
        loadCampusGeojson(),
        Promise.all([makePinImage(PIN_GOLD), makePinImage(PIN_GOLD_SELECTED, 1.15)]),
      ]);
      if (cancelled || !isMapReady(map)) return;

      if (!map.hasImage(PIN_IMAGE))
        map.addImage(PIN_IMAGE, pinImg, { pixelRatio: 2 });
      if (!map.hasImage(PIN_IMAGE_SELECTED))
        map.addImage(PIN_IMAGE_SELECTED, pinSelectedImg, { pixelRatio: 2 });

      const { zones, holeRings } = getMaskZones(geojson);
      addSatelliteWithMask(map, holeRings);
      addZoneOutlines(map, zones);
      addBuildingSource(map, geojson);
      addPinLayers(map, geojson);
      attachPinInteractions(
        map,
        (id, meta) => onSelectRef.current(id, meta),
        (id) => buildingsMapRef.current.get(id) ?? null,
      );

      centroidsRef.current = centroids;
      layersReadyRef.current = true;

      map.resize();
      syncPinSelection(map, prevSelectedIdRef.current);

      if (prevSelectedIdRef.current) {
        focusBuilding(map, prevSelectedIdRef.current, centroidsRef.current, paddingRef.current, false);
      } else {
        fitCampusView(map, paddingRef.current, false);
      }
    };

    const onLoad = () => {
      if (cancelled) return;
      requestAnimationFrame(() => {
        if (cancelled || !isMapReady(map)) return;
        map.resize();
        void setupLayers();
      });
    };

    const onMapError = (e: { error?: Error }) => {
      console.error("[map error]", e.error?.message ?? "unknown", { style: MAP_STYLE });
    };
    map.on("error", onMapError);

    if (map.isStyleLoaded()) onLoad();
    else map.once("load", onLoad);

    return () => {
      cancelled = true;
      layersReadyRef.current = false;
      map.off("error", onMapError);
      map.remove(); // also detaches pin layer handlers and the hover popup
      mapRef.current = null;
    };
  }, []);

  // ── Resize observers ───────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => resizeMap());
    observer.observe(el);
    return () => observer.disconnect();
  }, [resizeMap]);

  useEffect(() => { resizeMap(); }, [selectedId, resizeMap]);

  // ── Orientation-aware refit on window resize (debounced 300 ms) ────────────
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const map = mapRef.current;
        if (!isMapReady(map)) return;
        try { map.resize(); } catch { return; }
        // Only refit when no building is open; flyTo keeps selection view intact
        if (!prevSelectedIdRef.current) {
          fitCampusView(map, paddingRef.current);
        }
      }, 300);
    };
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); clearTimeout(timer); };
  }, []);

  // ── Selection sync + camera ────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersReadyRef.current) {
      prevSelectedIdRef.current = selectedId;
      return;
    }

    syncPinSelection(map, selectedId);

    if (selectedId !== null) {
      focusBuilding(map, selectedId, centroidsRef.current, paddingRef.current);
    } else {
      fitCampusView(map, paddingRef.current);
    }

    prevSelectedIdRef.current = selectedId;
  }, [selectedId]);

  // Reframe when panels open/close
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersReadyRef.current) return;
    if (selectedId) {
      focusBuilding(map, selectedId, centroidsRef.current, paddingRef.current, false);
    } else {
      fitCampusView(map, paddingRef.current, false);
    }
  }, [leftPanelCollapsed, rightSidebarOpen]);

  return (
    <div className="campus-map-container absolute inset-0">
      <div ref={containerRef} className="h-full w-full" />

      {/* Map controls — top right */}
      <div className="absolute top-4 right-4 z-10 flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => {
            const map = mapRef.current;
            if (!isMapReady(map)) return;
            fitCampusView(map, paddingRef.current);
          }}
          title="Campus home"
          className="map-control-btn"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>

        <div className="map-control-group">
          <button type="button" onClick={() => mapRef.current?.zoomIn({ duration: 250 })}
            title="Zoom in" className="map-control-btn map-control-btn--grouped">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <button type="button" onClick={() => mapRef.current?.zoomOut({ duration: 250 })}
            title="Zoom out" className="map-control-btn map-control-btn--grouped border-t border-gray-200">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" d="M5 12h14" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
