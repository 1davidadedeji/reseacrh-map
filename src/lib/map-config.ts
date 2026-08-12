export const MASK_OPACITY = 1.0;

export const INITIAL_CENTER: [number, number] = [-92.02184, 34.24382];
export const INITIAL_ZOOM = 16;
export const BUILDING_FOCUS_ZOOM = 18;
export const ROUTE_STEP_ZOOM = 19;
export const LABEL_MIN_ZOOM = 15.5;
export const SECONDARY_PIN_MIN_ZOOM = 16.5;

export const CAMPUS_BOUNDS_FALLBACK: [[number, number], [number, number]] = [
  [-92.0250, 34.2400],
  [-92.0170, 34.2530],
];
export const MAIN_CAMPUS_CENTER: [number, number] = [-92.02184, 34.24382];
export const MAIN_CAMPUS_RADIUS_KM = 1.2;
export const CAMPUS_MIN_ZOOM = 14;
export const CAMPUS_MAX_ZOOM = 19;

/** Soft pan limit around campus / Pine Bluff (west,south → east,north). */
export const MAP_MAX_BOUNDS: [[number, number], [number, number]] = [
  [-92.12, 34.15],
  [-91.90, 34.35],
];

export const LEFT_PANEL_W = 400;
export const LEFT_COLLAPSED_W = 48;
export const RIGHT_SIDEBAR_W = 320;

export const PIN_GOLD = "#EEB310";
export const PIN_GOLD_SELECTED = "#1E40AF";
export const PIN_SECONDARY = "#9CA3AF";

export function cameraDuration(ms: number, reducedMotion: boolean): number {
  return reducedMotion ? 0 : ms;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
