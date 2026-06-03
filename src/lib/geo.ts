import { bbox, center, distance, featureCollection, point } from "@turf/turf";
import type { CampusBuilding } from "@/lib/campus-data";

export function getCampusBounds(buildings: CampusBuilding[]) {
  const points = featureCollection(
    buildings.map((b) => point([b.longitude, b.latitude]))
  );
  const [west, south, east, north] = bbox(points);
  return { west, south, east, north };
}

export function getCampusCenter(buildings: CampusBuilding[]) {
  const points = featureCollection(
    buildings.map((b) => point([b.longitude, b.latitude]))
  );
  const [longitude, latitude] = center(points).geometry.coordinates;
  return { longitude, latitude };
}

export function getDistanceKm(
  from: { longitude: number; latitude: number },
  to: { longitude: number; latitude: number }
) {
  return distance(
    point([from.longitude, from.latitude]),
    point([to.longitude, to.latitude]),
    { units: "kilometers" }
  );
}

export function formatDistanceKm(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
