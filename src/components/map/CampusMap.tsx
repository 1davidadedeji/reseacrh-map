"use client";

import { useRef, useEffect, useCallback } from "react";
import maplibregl, {
  type ExpressionSpecification,
  type PaddingOptions,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  bbox, bboxPolygon, booleanClockwise, booleanIntersects, buffer,
  concave, convex, distance, explode, featureCollection, point, polygonSmooth, union,
} from "@turf/turf";
import type { Building } from "@/types";
import type { GeoJsonBuildingMeta } from "@/types/building-selection";
import type { DirectionsResult } from "@/lib/directions";

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? "";

// MapTiler minimal light basemap. If dataviz-light ever becomes unavailable
// on the plan, swap for: /maps/positron/style.json
const MAP_STYLE = `https://api.maptiler.com/maps/dataviz-light/style.json?key=${MAPTILER_KEY}`;

const SOURCE_ID        = "campus-buildings";
const SATELLITE_SOURCE = "satellite";
const MASK_SOURCE      = "satellite-mask";
const ZONES_SOURCE     = "satellite-zones";
const PINS_SOURCE      = "building-pins";
const ROUTE_SOURCE        = "route-line";
const ROUTE_ENDPOINTS_SOURCE = "route-endpoints";

const LAYER_SATELLITE     = "satellite-layer";
const LAYER_MASK          = "satellite-mask-layer";
const LAYER_ZONE_OUTLINE  = "satellite-zones-outline";
const LAYER_LABELS        = "buildings-labels";
const LAYER_PINS          = "pins-layer";
const LAYER_PINS_SELECTED = "pins-layer-selected";
const LAYER_ROUTE_CASING  = "route-casing-layer";
const LAYER_ROUTE_LINE    = "route-line-layer";
const LAYER_ROUTE_ENDPOINTS = "route-endpoints-layer";

// Route color intentionally distinct from the gold building pins — blue is
// the universal "this is a navigation path" convention (Google/Apple/Baylor).
const ROUTE_BLUE        = "#2563eb";
const ROUTE_BLUE_CASING = "#ffffff";

const PIN_IMAGE          = "uapb-pin";
const PIN_IMAGE_SELECTED = "uapb-pin-selected";

// Satellite + mask sit ABOVE the basemap's road layers (so no road lines
// render over the campus imagery) and below its symbol/label layers. Outside
// the zones the opaque mask therefore covers roads too: at 0.92 they faintly
// ghost through the mask; flip to 1.0 for the clean-paper look (no roads
// outside campus at all).
const MASK_OPACITY = 0.92;

const INITIAL_CENTER: [number, number] = [-92.02184, 34.24382];
const INITIAL_ZOOM        = 16;
const BUILDING_FOCUS_ZOOM = 18;
const LABEL_MIN_ZOOM      = 15.5;

// Fallback framing used until the campus zone is computed from building
// footprints on first load (getMaskZones updates campusFitBounds).
const CAMPUS_BOUNDS_FALLBACK: [[number, number], [number, number]] = [
  [-92.0250, 34.2400],
  [-92.0170, 34.2530],
];
const MAIN_CAMPUS_CENTER: [number, number] = [-92.02184, 34.24382];
const MAIN_CAMPUS_RADIUS_KM = 1.2;
const CAMPUS_MIN_ZOOM = 15.8;
const CAMPUS_MAX_ZOOM = 18;

let campusFitBounds = CAMPUS_BOUNDS_FALLBACK;
let mainCampusFitBounds = CAMPUS_BOUNDS_FALLBACK;

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

const LEFT_PANEL_W    = 400;
const LEFT_COLLAPSED_W = 48;
const RIGHT_SIDEBAR_W = 320;
const MAP_UI_BOTTOM   = 100;

const PIN_GOLD          = "#EEB310";
const PIN_GOLD_SELECTED = "#1E40AF"; // navy blue — contrasts with gold default pins

// ── Pin SVG geometry (28 × 34) ─────────────────────────────────────────────────
// Circle head: r=11 centered at (14,13).  Tip at (14,33) → anchor: "bottom" puts
// the tip exactly on the building centroid.
const PIN_W    = 28;
const PIN_H    = 34;
const PIN_PATH = "M14 33C8 24 3 20 3 13A11 11 0 1 1 25 13C25 20 20 24 14 33Z";
// Columned-building icon inside circle (pediment + 3 columns + base)
const ICON_PATH = "M7 13L14 7L21 13M7 13h14M9 13v7M14 13v7M19 13v7M7 20h14";

export interface UserLocation {
  lng: number;
  lat: number;
}

interface CampusMapProps {
  buildings: Building[];
  selectedId: string | null;
  onSelectBuilding: (id: string, meta?: GeoJsonBuildingMeta) => void;
  leftPanelCollapsed?: boolean;
  rightSidebarOpen?: boolean;
  route?: DirectionsResult | null;
  userLocation?: UserLocation | null;
  onUserLocationChange?: (loc: UserLocation | null) => void;
  /** New array reference on every click — pans to a turn-by-turn step. */
  focusPoint?: [number, number] | null;
  /** Increment to force a full campus overview refit (logo / home reset). */
  viewResetNonce?: number;
  onCampusHomeClick?: () => void;
}

const EMPTY_FEATURE_COLLECTION: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

function routeLineFeatureCollection(route: DirectionsResult | null): GeoJSON.FeatureCollection {
  if (!route) return EMPTY_FEATURE_COLLECTION;
  return {
    type: "FeatureCollection",
    features: [{ type: "Feature", geometry: route.geometry, properties: {} }],
  };
}

function routeEndpointsFeatureCollection(route: DirectionsResult | null): GeoJSON.FeatureCollection<GeoJSON.Point> {
  if (!route) return { type: "FeatureCollection", features: [] };
  const coords = route.geometry.coordinates;
  const start = coords[0];
  const end = coords[coords.length - 1];
  if (!start || !end) return { type: "FeatureCollection", features: [] };
  return {
    type: "FeatureCollection",
    features: [
      { type: "Feature", geometry: { type: "Point", coordinates: start as [number, number] }, properties: { label: "A" } },
      { type: "Feature", geometry: { type: "Point", coordinates: end as [number, number] }, properties: { label: "B" } },
    ],
  };
}

// ── Layout / camera helpers ────────────────────────────────────────────────────

function buildMapPadding(lc: boolean, rs: boolean): PaddingOptions {
  return {
    left:   (lc ? LEFT_COLLAPSED_W : LEFT_PANEL_W) + 16,
    top:    16,
    right:  (rs ? RIGHT_SIDEBAR_W : 0) + 48,
    bottom: 48,
  };
}

function fitCampusView(map: maplibregl.Map, padding: PaddingOptions, animate = true) {
  try {
    map.fitBounds(mainCampusFitBounds, {
      padding,
      pitch:   0,
      bearing: 0,
      duration: animate ? 600 : 0,
      maxZoom:  CAMPUS_MAX_ZOOM,
    });
    const enforceMinZoom = () => {
      if (!isMapReady(map)) return;
      if (map.getZoom() < CAMPUS_MIN_ZOOM) {
        map.easeTo({ zoom: CAMPUS_MIN_ZOOM, duration: animate ? 300 : 0 });
      }
    };
    if (animate) map.once("moveend", enforceMinZoom);
    else enforceMinZoom();
  } catch { /* ignore during teardown */ }
}

function isMapReady(map: maplibregl.Map | null): map is maplibregl.Map {
  if (!map) return false;
  try { return Boolean(map.getContainer()?.isConnected) && Boolean(map.isStyleLoaded()); }
  catch { return false; }
}

// ── GeoJSON helpers ────────────────────────────────────────────────────────────

/** Generic OSM placeholders — not real campus buildings in our dataset. */
function isValidBuildingId(id: string): boolean {
  const normalized = id.trim().toLowerCase();
  return normalized.length > 0 && normalized !== "building";
}

function buildingMetaFromFeature(f: GeoJSON.Feature): GeoJsonBuildingMeta | null {
  const p = f.properties;
  if (!p) return null;
  const id = p.building_id as string | undefined;
  if (!id || !isValidBuildingId(id)) return null;
  const name = String(p.name ?? id).trim();
  if (name.toLowerCase() === "building" && id.toLowerCase() === "building") return null;
  return { id, name, code: String(p.code ?? "") };
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

function filterMainCampusFeatures(geojson: GeoJSON.FeatureCollection): GeoJSON.FeatureCollection {
  const center = point(MAIN_CAMPUS_CENTER);
  return {
    type: "FeatureCollection",
    features: geojson.features.filter((f) => {
      const c = centroidFromFeature(f);
      if (!c) return false;
      return distance(center, point(c), { units: "kilometers" }) <= MAIN_CAMPUS_RADIUS_KM;
    }),
  };
}

function updateMainCampusFitBounds(geojson: GeoJSON.FeatureCollection) {
  const main = filterMainCampusFeatures(geojson);
  if (main.features.length === 0) return;
  const zone = computeCampusZone(main);
  const [w, s, e, n] = bbox(zone);
  mainCampusFitBounds = [[w, s], [e, n]];
}

let cachedMaskZones: MaskZones | null = null;

function getMaskZones(geojson: GeoJSON.FeatureCollection): MaskZones {
  if (cachedMaskZones) return cachedMaskZones;
  const campusZone = computeCampusZone(geojson);
  const [w, s, e, n] = bbox(campusZone);
  campusFitBounds = [[w, s], [e, n]];
  updateMainCampusFitBounds(geojson);
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
    filter: ["all", ["has", "building_id"], ["!=", ["get", "building_id"], "building"]],
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
      bearing: 0,
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

  return `<div data-building-hover-card role="button" tabindex="0" style="padding:12px;width:210px;font-family:system-ui,-apple-system,sans-serif;cursor:pointer;">
    ${header}
    <p style="margin:0;font-weight:700;font-size:13px;color:#111;line-height:1.3;">${esc(meta.name)}</p>
    ${meta.code ? `<p style="margin:2px 0 0;font-size:10px;color:#999;font-family:monospace;letter-spacing:.04em;">${esc(meta.code)}</p>` : ""}
    ${desc}${detailLine}
    <p style="margin:8px 0 0;font-size:10px;color:${PIN_GOLD};font-weight:600;">View research →</p>
  </div>`;
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
  const seen = new Set<string>();
  for (const f of geojson.features) {
    const meta  = buildingMetaFromFeature(f);
    const coord = meta ? centroidFromFeature(f) : null;
    if (!meta || !coord || seen.has(meta.id)) continue;
    seen.add(meta.id);
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
const PIN_ICON_SIZE_SELECTED: ExpressionSpecification =
  ["interpolate", ["linear"], ["zoom"], 13, 0.7, 15, 1.05, 16.5, 1.35];
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

  // Selected building: larger pin — always visible above others
  map.addLayer({
    id: LAYER_PINS_SELECTED, type: "symbol", source: PINS_SOURCE,
    filter: ["==", ["get", "building_id"], ""],
    layout: {
      "icon-image":            PIN_IMAGE_SELECTED,
      "icon-anchor":           "bottom",
      "icon-size":             PIN_ICON_SIZE_SELECTED,
      "icon-allow-overlap":    true,
      "icon-ignore-placement": true,
    },
    paint: {
      "icon-translate":        [0, -8],
      "icon-translate-anchor": "viewport",
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

// Route line + A/B endpoint markers, drawn above the satellite mask and below
// the building pins so pins stay clickable over the route.
function addRouteLayers(map: maplibregl.Map) {
  if (map.getSource(ROUTE_SOURCE)) return;

  map.addSource(ROUTE_SOURCE, { type: "geojson", data: EMPTY_FEATURE_COLLECTION });
  map.addLayer({
    id: LAYER_ROUTE_CASING, type: "line", source: ROUTE_SOURCE,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": ROUTE_BLUE_CASING, "line-width": 7, "line-opacity": 0.9 },
  }, LAYER_LABELS);
  map.addLayer({
    id: LAYER_ROUTE_LINE, type: "line", source: ROUTE_SOURCE,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": ROUTE_BLUE, "line-width": 4 },
  }, LAYER_LABELS);

  map.addSource(ROUTE_ENDPOINTS_SOURCE, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  map.addLayer({
    id: LAYER_ROUTE_ENDPOINTS, type: "circle", source: ROUTE_ENDPOINTS_SOURCE,
    paint: {
      "circle-radius": 9,
      "circle-color": ["match", ["get", "label"], "A", "#16a34a", "B", "#dc2626", ROUTE_BLUE],
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 2,
    },
  });
}

function syncRoute(map: maplibregl.Map, route: DirectionsResult | null) {
  const lineSource = map.getSource(ROUTE_SOURCE) as maplibregl.GeoJSONSource | undefined;
  const endpointsSource = map.getSource(ROUTE_ENDPOINTS_SOURCE) as maplibregl.GeoJSONSource | undefined;
  lineSource?.setData(routeLineFeatureCollection(route));
  endpointsSource?.setData(routeEndpointsFeatureCollection(route));
}

function fitRouteBounds(map: maplibregl.Map, route: DirectionsResult, padding: PaddingOptions) {
  try {
    const [w, s, e, n] = bbox({ type: "Feature", geometry: route.geometry, properties: {} });
    map.fitBounds([[w, s], [e, n]], {
      padding,
      pitch:   0,
      bearing: 0,
      duration: 600,
      maxZoom:  18,
    });
  } catch { /* teardown */ }
}

// ── "You are here" marker ──────────────────────────────────────────────────────

function makeUserLocationEl(): HTMLDivElement {
  const el = document.createElement("div");
  el.style.width = "16px";
  el.style.height = "16px";
  el.style.borderRadius = "50%";
  el.style.background = ROUTE_BLUE;
  el.style.border = "3px solid #ffffff";
  el.style.boxShadow = "0 0 0 2px rgba(37,99,235,0.35), 0 2px 6px rgba(0,0,0,0.35)";
  return el;
}

function syncUserLocationMarker(
  map: maplibregl.Map,
  markerRef: { current: maplibregl.Marker | null },
  location: UserLocation | null,
) {
  if (!location) {
    markerRef.current?.remove();
    markerRef.current = null;
    return;
  }
  if (!markerRef.current) {
    markerRef.current = new maplibregl.Marker({ element: makeUserLocationEl() });
  }
  markerRef.current.setLngLat([location.lng, location.lat]).addTo(map);
}

function attachPinInteractions(
  map:         maplibregl.Map,
  onSelect:    (id: string, meta: GeoJsonBuildingMeta) => void,
  getBuilding: (id: string) => Building | null,
) {
  const popup = new maplibregl.Popup({
    closeButton: false, closeOnClick: false,
    anchor: "bottom", offset: [0, -(PIN_H + 4)],
    maxWidth: "230px", className: "building-pin-popup",
  });

  let hideTimer: ReturnType<typeof setTimeout> | null = null;
  let hoveredMeta: GeoJsonBuildingMeta | null = null;

  function cancelHide() {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  }

  function scheduleHide() {
    cancelHide();
    hideTimer = setTimeout(() => {
      popup.remove();
      hoveredMeta = null;
    }, 280);
  }

  function wirePopupElement() {
    const el = popup.getElement();
    if (!el || el.dataset.wired === "1") return;
    el.dataset.wired = "1";
    el.addEventListener("mouseenter", cancelHide);
    el.addEventListener("mouseleave", scheduleHide);
    el.addEventListener("click", () => {
      if (!hoveredMeta) return;
      onSelect(hoveredMeta.id, hoveredMeta);
      cancelHide();
      popup.remove();
      hoveredMeta = null;
    });
  }

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
      cancelHide();
      hoveredMeta = meta;
      const coord = (f.geometry as GeoJSON.Point).coordinates as [number, number];
      popup
        .setLngLat(coord)
        .setHTML(renderTooltipBody(meta, getBuilding(meta.id)))
        .addTo(map);
      requestAnimationFrame(wirePopupElement);
    });

    map.on("mouseleave", layerId, () => {
      map.getCanvas().style.cursor = "";
      scheduleHide();
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
    const meta = buildingMetaFromFeature(f);
    if (!meta || centroids.has(meta.id)) continue;
    const c = centroidFromFeature(f);
    if (c) centroids.set(meta.id, c);
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
  route              = null,
  userLocation       = null,
  onUserLocationChange,
  focusPoint         = null,
  viewResetNonce     = 0,
  onCampusHomeClick,
}: CampusMapProps) {
  const containerRef      = useRef<HTMLDivElement>(null);
  const mapRef            = useRef<maplibregl.Map | null>(null);
  const layersReadyRef    = useRef(false);
  const prevSelectedIdRef = useRef<string | null>(null);
  const centroidsRef      = useRef<Map<string, [number, number]>>(new Map());
  const paddingRef        = useRef(buildMapPadding(leftPanelCollapsed, rightSidebarOpen));
  const buildingsMapRef   = useRef<Map<string, Building>>(new Map());
  const routeRef          = useRef<DirectionsResult | null>(route);
  const userLocationRef   = useRef<UserLocation | null>(userLocation);
  const userMarkerRef     = useRef<maplibregl.Marker | null>(null);
  const cameraTokenRef    = useRef(0);
  const lastViewResetRef  = useRef(0);

  paddingRef.current = buildMapPadding(leftPanelCollapsed, rightSidebarOpen);
  routeRef.current = route;
  userLocationRef.current = userLocation;

  const onSelectRef = useRef(onSelectBuilding);
  onSelectRef.current = onSelectBuilding;

  const onUserLocationChangeRef = useRef(onUserLocationChange);
  onUserLocationChangeRef.current = onUserLocationChange;

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
      bearing: 0,
    });

    mapRef.current       = map;
    layersReadyRef.current = false;

    const setupLayers = async () => {
      if (cancelled || !isMapReady(map)) return;
      const [{ geojson, centroids }, [pinImg, pinSelectedImg]] = await Promise.all([
        loadCampusGeojson(),
        Promise.all([makePinImage(PIN_GOLD), makePinImage(PIN_GOLD_SELECTED, 1.35)]),
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
      addRouteLayers(map);
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
      syncRoute(map, routeRef.current);
      syncUserLocationMarker(map, userMarkerRef, userLocationRef.current);

      if (routeRef.current) {
        fitRouteBounds(map, routeRef.current, paddingRef.current);
      } else if (prevSelectedIdRef.current) {
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

  // ── Unified camera sync (single owner — avoids competing flyTo/fitBounds) ───
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersReadyRef.current) {
      prevSelectedIdRef.current = selectedId;
      return;
    }

    syncPinSelection(map, selectedId);
    prevSelectedIdRef.current = selectedId;

    const token = ++cameraTokenRef.current;
    const padding = paddingRef.current;
    const isHomeReset = viewResetNonce > 0 && viewResetNonce !== lastViewResetRef.current;

    const applyCamera = (animate: boolean) => {
      if (token !== cameraTokenRef.current || !isMapReady(map)) return;
      try { map.resize(); } catch { return; }

      if (focusPoint) {
        map.flyTo({
          center:   focusPoint,
          zoom:     19,
          pitch:    0,
          bearing:  0,
          padding,
          duration: animate ? 600 : 0,
        });
        return;
      }
      if (route) {
        fitRouteBounds(map, route, padding);
        return;
      }
      if (selectedId) {
        focusBuilding(map, selectedId, centroidsRef.current, padding, animate);
        return;
      }
      fitCampusView(map, padding, animate);
    };

    if (isHomeReset) {
      lastViewResetRef.current = viewResetNonce;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => applyCamera(true));
      });
    } else {
      applyCamera(true);
    }
  }, [
    selectedId,
    route,
    focusPoint,
    leftPanelCollapsed,
    rightSidebarOpen,
    viewResetNonce,
  ]);

  // ── Orientation-aware refit on window resize (debounced 300 ms) ────────────
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const map = mapRef.current;
        if (!isMapReady(map)) return;
        try { map.resize(); } catch { return; }
        if (!routeRef.current && !prevSelectedIdRef.current) {
          fitCampusView(map, paddingRef.current, false);
        }
      }, 300);
    };
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); clearTimeout(timer); };
  }, []);

  // ── Route polyline sync ─────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersReadyRef.current) return;
    syncRoute(map, route);
  }, [route]);

  // ── User location marker sync ───────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersReadyRef.current) return;
    syncUserLocationMarker(map, userMarkerRef, userLocation);
  }, [userLocation]);

  return (
    <div className="campus-map-container absolute inset-0">
      <div ref={containerRef} className="h-full w-full" />

      {/* Map controls — top right */}
      <div className="absolute top-4 right-4 z-10 flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (onCampusHomeClick) {
              onCampusHomeClick();
              return;
            }
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

        <button
          type="button"
          onClick={() => {
            if (!navigator.geolocation) return;
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const loc = { lng: pos.coords.longitude, lat: pos.coords.latitude };
                onUserLocationChangeRef.current?.(loc);
                const map = mapRef.current;
                if (isMapReady(map) && !routeRef.current) {
                  map.flyTo({ center: [loc.lng, loc.lat], zoom: 17, duration: 900 });
                }
              },
              (err) => console.error("[geolocation]", err.message),
              { enableHighAccuracy: true, timeout: 8000 },
            );
          }}
          title="My location"
          className="map-control-btn"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 8a4 4 0 100 8 4 4 0 000-8z" />
            <path strokeLinecap="round" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
