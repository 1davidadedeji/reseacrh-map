import {
  bbox,
  bboxPolygon,
  booleanClockwise,
  booleanIntersects,
  buffer,
  concave,
  convex,
  distance,
  explode,
  featureCollection,
  point,
  polygonSmooth,
  union,
} from "@turf/turf";
import {
  CAMPUS_BOUNDS_FALLBACK,
  MAIN_CAMPUS_CENTER,
  MAIN_CAMPUS_RADIUS_KM,
} from "@/lib/map-config";

export type Zone = GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;

export interface MaskZones {
  zones: Zone[];
  holeRings: GeoJSON.Position[][];
}

export type FitBounds = [[number, number], [number, number]];

export const WORLD_RING: [number, number][] = [
  [-180, -85],
  [180, -85],
  [180, 85],
  [-180, 85],
  [-180, -85],
];

/** Off-campus research sites revealed through the satellite mask. */
export const OFF_CAMPUS_SITES = [
  {
    id: "econ-dev-center",
    name: "Economic Development Center",
    lng: -92.0031,
    lat: 34.2233,
    radius: 120,
  },
  {
    id: "ag-tech-center",
    name: "Agricultural Technology & Training Center",
    lng: -92.0273,
    lat: 34.2527,
    radius: 150,
  },
  {
    id: "parker-ag-research",
    name: "S.J. Parker Agricultural Research Centre",
    lng: -92.0242,
    lat: 34.2525,
    radius: 150,
  },
] as const;

let campusFitBounds: FitBounds = CAMPUS_BOUNDS_FALLBACK;
let mainCampusFitBounds: FitBounds = CAMPUS_BOUNDS_FALLBACK;
let cachedMaskZones: MaskZones | null = null;

function ringCentroid(ring: number[][]): [number, number] | null {
  let n = ring.length;
  if (n === 0) return null;
  const [f, l] = [ring[0], ring[n - 1]];
  if (n > 1 && f[0] === l[0] && f[1] === l[1]) n -= 1;
  if (n === 0) return null;
  let lng = 0;
  let lat = 0;
  for (let i = 0; i < n; i++) {
    lng += ring[i][0];
    lat += ring[i][1];
  }
  return [lng / n, lat / n];
}

export function centroidFromFeature(f: GeoJSON.Feature): [number, number] | null {
  const g = f.geometry;
  if (g.type === "Polygon") return ringCentroid(g.coordinates[0]);
  if (g.type === "MultiPolygon") return ringCentroid(g.coordinates[0][0]);
  return null;
}

export function computeCampusZone(geojson: GeoJSON.FeatureCollection): Zone {
  const points = explode(geojson);
  let hull: Zone | null = null;
  for (let step = 0; step <= 5; step++) {
    const h = concave(points, { maxEdge: 0.2 + step * 0.05, units: "kilometers" });
    if (h && h.geometry.type === "Polygon") {
      hull = h;
      break;
    }
  }
  hull ??= convex(points);
  const base: Zone = hull ?? bboxPolygon(bbox(geojson));
  const buffered = buffer(base, 40, { units: "meters" }) ?? base;
  return polygonSmooth(buffered, { iterations: 2 }).features[0] ?? buffered;
}

export function computeOffCampusZones(): Zone[] {
  const byId = new Map<string, Zone>();
  for (const s of OFF_CAMPUS_SITES) {
    const zone = buffer(
      point([s.lng, s.lat], { site_id: s.id, name: s.name }),
      s.radius,
      { units: "meters" },
    );
    if (zone) byId.set(s.id, zone);
  }
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

export function dissolveOverlaps(zones: Zone[]): Zone[] {
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

export function zoneHoleRings(zones: Zone[]): GeoJSON.Position[][] {
  const rings: GeoJSON.Position[][] = [];
  for (const zone of zones) {
    const polys =
      zone.geometry.type === "Polygon"
        ? [zone.geometry.coordinates]
        : zone.geometry.coordinates;
    for (const poly of polys) {
      const outer = poly[0];
      rings.push(booleanClockwise(outer) ? outer : [...outer].reverse());
    }
  }
  return rings;
}

export function filterMainCampusFeatures(
  geojson: GeoJSON.FeatureCollection,
): GeoJSON.FeatureCollection {
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

export function getMaskZones(geojson: GeoJSON.FeatureCollection): MaskZones {
  if (cachedMaskZones) return cachedMaskZones;
  const main = filterMainCampusFeatures(geojson);
  const campusZone = computeCampusZone(main.features.length ? main : geojson);
  const [w, s, e, n] = bbox(campusZone);
  campusFitBounds = [
    [w, s],
    [e, n],
  ];
  mainCampusFitBounds = [
    [w, s],
    [e, n],
  ];
  const zones = dissolveOverlaps([campusZone, ...computeOffCampusZones()]);
  cachedMaskZones = { zones, holeRings: zoneHoleRings(zones) };
  return cachedMaskZones;
}

export function clearMaskZonesCache() {
  cachedMaskZones = null;
}

export function getMainCampusFitBounds(): FitBounds {
  return mainCampusFitBounds;
}

export function getCampusFitBounds(): FitBounds {
  return campusFitBounds;
}
