import { describe, expect, it } from "vitest";
import {
  displayBuildingName,
  resolveCategory,
  resolvePinTier,
} from "@/lib/building-catalog";

describe("building-catalog", () => {
  it("marks research hubs primary", () => {
    expect(resolvePinTier("stem-building")).toBe("primary");
    expect(resolvePinTier("walker-research-center")).toBe("primary");
    expect(resolvePinTier("parker-ag-research")).toBe("primary");
  });

  it("marks housing and amenities secondary", () => {
    expect(resolvePinTier("delta-housing-complex")).toBe("secondary");
    expect(resolvePinTier("johnny-b-johnson-housing-complex")).toBe("secondary");
    expect(resolvePinTier("fitness-center")).toBe("secondary");
    expect(resolvePinTier("holiday-hall")).toBe("secondary");
  });

  it("defaults unknown ids to secondary", () => {
    expect(resolvePinTier("some-random-osm-building")).toBe("secondary");
  });

  it("fixes known display names", () => {
    expect(displayBuildingName("caldwell-hall", "Caldwell hall")).toBe("Caldwell Hall");
    expect(displayBuildingName("la-davis-student-union", "L.A. David Sr. Student Union")).toMatch(
      /Davis/,
    );
  });

  it("categorizes housing", () => {
    expect(resolveCategory("delta-housing-complex")).toBe("Housing");
  });
});
