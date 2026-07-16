import { bbox, center, distance, featureCollection, point } from "@turf/turf";
import type { Building } from "@/types";

export function getCampusBounds(buildings: Building[]) {
  const points = featureCollection(buildings.map((b) => point([b.lng, b.lat])));
  const [west, south, east, north] = bbox(points);
  return { west, south, east, north };
}

export function getCampusCenter(buildings: Building[]) {
  const points = featureCollection(buildings.map((b) => point([b.lng, b.lat])));
  const [lng, lat] = center(points).geometry.coordinates;
  return { lng, lat };
}

export function getDistanceKm(
  from: { lng: number; lat: number },
  to: { lng: number; lat: number }
) {
  return distance(point([from.lng, from.lat]), point([to.lng, to.lat]), {
    units: "kilometers",
  });
}

export function formatDistanceKm(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
