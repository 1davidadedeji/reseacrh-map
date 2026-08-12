import { describe, expect, it } from "vitest";
import {
  MASK_OPACITY,
  CAMPUS_MIN_ZOOM,
  CAMPUS_MAX_ZOOM,
  cameraDuration,
} from "@/lib/map-config";

describe("map-config", () => {
  it("uses fully opaque satellite mask", () => {
    expect(MASK_OPACITY).toBe(1);
  });

  it("allows neighborhood-to-building zoom", () => {
    expect(CAMPUS_MIN_ZOOM).toBeLessThanOrEqual(14.5);
    expect(CAMPUS_MAX_ZOOM).toBeGreaterThanOrEqual(19);
  });

  it("cameraDuration respects reduced motion", () => {
    expect(cameraDuration(600, true)).toBe(0);
    expect(cameraDuration(600, false)).toBe(600);
  });
});
