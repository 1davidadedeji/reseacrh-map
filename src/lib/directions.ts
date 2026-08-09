// Client-side Mapbox Directions API helper. NEXT_PUBLIC_MAPBOX_TOKEN is a
// public token — safe to call directly from the browser, no server proxy needed.

export type TravelProfile = "walking" | "driving";

export interface DirectionsStep {
  instruction: string;
  distanceMeters: number;
  location: [number, number];
}

export interface DirectionsResult {
  profile: TravelProfile;
  geometry: GeoJSON.LineString;
  distanceMeters: number;
  durationSeconds: number;
  steps: DirectionsStep[];
}

export class DirectionsError extends Error {}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

interface MapboxDirectionsResponse {
  code: string;
  routes?: {
    geometry: GeoJSON.LineString;
    distance: number;
    duration: number;
    legs: {
      steps: {
        distance: number;
        maneuver: { instruction: string; location: [number, number] };
      }[];
    }[];
  }[];
}

export async function getRoute(
  from: [number, number],
  to: [number, number],
  profile: TravelProfile
): Promise<DirectionsResult> {
  if (!MAPBOX_TOKEN) {
    throw new DirectionsError("Directions are unavailable — no Mapbox token configured.");
  }

  const coords = `${from[0]},${from[1]};${to[0]},${to[1]}`;
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coords}` +
    `?geometries=geojson&steps=true&overview=full&access_token=${MAPBOX_TOKEN}`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new DirectionsError("Could not reach the directions service. Check your connection.");
  }

  if (!res.ok) {
    throw new DirectionsError(`Directions request failed (HTTP ${res.status}).`);
  }

  const body = (await res.json()) as MapboxDirectionsResponse;
  const route = body.routes?.[0];
  if (body.code !== "Ok" || !route) {
    throw new DirectionsError("No route could be found between those two points.");
  }

  const steps: DirectionsStep[] = route.legs.flatMap((leg) =>
    leg.steps.map((s) => ({
      instruction: s.maneuver.instruction,
      distanceMeters: s.distance,
      location: s.maneuver.location,
    }))
  );

  return {
    profile,
    geometry: route.geometry,
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    steps,
  };
}

const METERS_PER_MILE = 1609.34;
const METERS_PER_FOOT = 0.3048;

export function formatDistance(meters: number): string {
  const miles = meters / METERS_PER_MILE;
  if (miles < 0.3) {
    const feet = Math.round(meters / METERS_PER_FOOT);
    return `${feet} ft`;
  }
  return `${miles.toFixed(1)} mi`;
}

export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) return "< 1 min";
  return `${minutes} min`;
}
