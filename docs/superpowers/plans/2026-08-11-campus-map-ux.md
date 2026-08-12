# Campus Map UX & Directory Professionalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the UAPB Research Map feel professional: opaque campus-only satellite, primary/secondary pins, campus-first zoom, warm MapLibre shell across Faculty & Researchers, and a standard faculty directory — without a rewrite or new 3D stack.

**Architecture:** Keep MapLibre + MapTiler. Extract map constants/mask helpers and a building catalog (`pinTier` / `category`). Introduce a shared client `(shell)` layout that keeps `CampusMap` mounted while `/directory` renders over it. Harden camera/zoom and left-panel transitions. Redesign directory copy/layout in place.

**Tech Stack:** Next.js 16 App Router, React 19, MapLibre GL 5, Turf 7, Tailwind 4, pnpm. Add Vitest only for pure catalog/config helpers (no MapLibre unit tests).

**Spec:** `docs/superpowers/specs/2026-08-11-campus-map-ux-design.md`

## Global Constraints

- No Cesium / Three / deck.gl; map stays top-down 2D (`pitch: 0`, `bearing: 0`).
- Satellite aerial only inside campus + off-campus research holes; surroundings are opaque flat basemap (`MASK_OPACITY = 1.0`).
- Research/primary buildings get full pins; other campus buildings are secondary (muted, `minzoom` ~16.5).
- Zoom range ~14–19; soft `maxBounds` around Pine Bluff / campus.
- Nav label and page title: **Faculty & Researchers** (never “People Directory”).
- `/` ↔ `/directory` must not destroy the MapLibre instance.
- No drive-by refactors outside map / shell / directory / related data; do not expand dead `BuildingSidebar`.
- Preserve directions, `?building=` deep links, AI assistant mount, primary research detail.
- Before map/layout code: skim `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md` and `04-linking-and-navigating.md`.

---

## File structure (create / modify)

| File | Responsibility |
| --- | --- |
| Create: `src/lib/map-config.ts` | Zoom, bounds, padding, mask opacity, colors, motion helper |
| Create: `src/lib/campus-mask.ts` | Zone/hull/hole helpers + `getMaskZones` |
| Create: `src/lib/building-catalog.ts` | `pinTier`, `category`, display name fixes, lookups |
| Create: `src/lib/ui-copy.ts` | Nav/directory strings |
| Create: `src/components/layout/ExplorerShell.tsx` | Persistent header + map host + route children |
| Create: `src/components/layout/PlaceDetailPanel.tsx` | Compact secondary-building card |
| Create: `src/app/(shell)/layout.tsx` | Wraps explorer shell |
| Create: `src/app/(shell)/page.tsx` | Map route (panel + visible map) |
| Create: `src/app/(shell)/directory/page.tsx` | Directory route |
| Create: `src/lib/__tests__/building-catalog.test.ts` | Catalog unit tests |
| Create: `src/lib/__tests__/map-config.test.ts` | Config unit tests |
| Modify: `src/components/map/CampusMap.tsx` | Consume extracted modules; pin tiers; zoom |
| Modify: `src/components/layout/CampusExplorer.tsx` | Become map-page body under shell (or fold into shell) |
| Modify: `src/components/layout/LeftPanel.tsx` | Animated width shell; all-campus filter |
| Modify: `src/components/layout/AppHeader.tsx` | Faculty & Researchers label |
| Modify: `src/components/layout/BuildingDetailPanel.tsx` | Primary-only research chrome |
| Modify: `src/components/directory/PeopleDirectory.tsx` | Rename UX → professional directory |
| Modify: `src/components/directory/ProfileCard.tsx` | View profile CTA; list/grid support |
| Modify: `src/components/directory/ProfileModal.tsx` | “View on campus map” label |
| Modify: `package.json` | `test` script + vitest |
| Delete after move: `src/app/page.tsx`, `src/app/directory/page.tsx` (replaced by `(shell)` routes) |

---

### Task 1: Map config + opaque campus mask

**Files:**
- Create: `src/lib/map-config.ts`
- Create: `src/lib/campus-mask.ts`
- Create: `src/lib/__tests__/map-config.test.ts`
- Modify: `src/components/map/CampusMap.tsx`
- Test: `src/lib/__tests__/map-config.test.ts`

**Interfaces:**
- Produces: `MASK_OPACITY`, `CAMPUS_MIN_ZOOM`, `CAMPUS_MAX_ZOOM`, `BUILDING_FOCUS_ZOOM`, `MAIN_CAMPUS_CENTER`, `MAIN_CAMPUS_RADIUS_KM`, `LEFT_PANEL_W`, `LEFT_COLLAPSED_W`, `cameraDuration(ms)`, `getMaskZones(geojson)`, `clearMaskZonesCache()`

- [ ] **Step 1: Add Vitest**

```bash
pnpm add -D vitest
```

Add to `package.json`:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run"
}
```

Add `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: { environment: "node" },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

- [ ] **Step 2: Write failing map-config tests**

```ts
// src/lib/__tests__/map-config.test.ts
import { describe, expect, it } from "vitest";
import { MASK_OPACITY, CAMPUS_MIN_ZOOM, CAMPUS_MAX_ZOOM, cameraDuration } from "@/lib/map-config";

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
```

- [ ] **Step 3: Run tests — expect FAIL**

Run: `pnpm test`
Expected: FAIL (module not found / wrong opacity)

- [ ] **Step 4: Implement `map-config.ts`**

```ts
// src/lib/map-config.ts
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

/** Soft pan limit around campus / Pine Bluff (west,south,east,north as LngLatBoundsLike). */
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
```

- [ ] **Step 5: Extract `campus-mask.ts` from `CampusMap.tsx`**

Move `WORLD_RING`, `OFF_CAMPUS_SITES`, `computeCampusZone`, `computeOffCampusZones`, `dissolveOverlaps`, `zoneHoleRings`, `filterMainCampusFeatures`, `getMaskZones`, and module caches into `src/lib/campus-mask.ts`.

**Critical change in `getMaskZones`:** compute the campus hull from **main-campus features only**:

```ts
export function getMaskZones(geojson: GeoJSON.FeatureCollection): MaskZones {
  if (cachedMaskZones) return cachedMaskZones;
  const main = filterMainCampusFeatures(geojson);
  const campusZone = computeCampusZone(main.features.length ? main : geojson);
  const [w, s, e, n] = bbox(campusZone);
  campusFitBounds = [[w, s], [e, n]];
  mainCampusFitBounds = [[w, s], [e, n]];
  const zones = dissolveOverlaps([campusZone, ...computeOffCampusZones()]);
  cachedMaskZones = { zones, holeRings: zoneHoleRings(zones) };
  return cachedMaskZones;
}

export function clearMaskZonesCache() {
  cachedMaskZones = null;
}
```

Export `mainCampusFitBounds` getter used by `fitCampusView`.

- [ ] **Step 6: Wire `CampusMap.tsx` to use extracted modules; set mask paint to `MASK_OPACITY`**

In `addSatelliteWithMask`, ensure:

```ts
paint: { "fill-color": basemapBackgroundColor(map), "fill-opacity": MASK_OPACITY }
```

On map create, set:

```ts
minZoom: CAMPUS_MIN_ZOOM,
maxZoom: CAMPUS_MAX_ZOOM,
maxBounds: MAP_MAX_BOUNDS,
```

(Full zoom feel polish continues in Task 3; constants must already be correct here.)

- [ ] **Step 7: Run tests — expect PASS**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 8: Manual mask check**

Run: `pnpm run dev` → open `/` → pan outside campus.
Expected: solid paper basemap, no satellite/road ghosting; campus satellite intact; off-campus research islands still punched.

- [ ] **Step 9: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts \
  src/lib/map-config.ts src/lib/campus-mask.ts \
  src/lib/__tests__/map-config.test.ts \
  src/components/map/CampusMap.tsx
git commit -m "$(cat <<'EOF'
fix: opaque campus satellite mask and shared map config

Punch satellite only through main-campus and off-campus research
holes with a fully opaque basemap mask; extract map constants.
EOF
)"
```

---

### Task 2: Building catalog + primary/secondary pins

**Files:**
- Create: `src/lib/building-catalog.ts`
- Create: `src/lib/__tests__/building-catalog.test.ts`
- Create: `src/components/layout/PlaceDetailPanel.tsx`
- Modify: `src/components/map/CampusMap.tsx`
- Modify: `src/components/layout/LeftPanel.tsx`
- Modify: `src/components/layout/BuildingDetailPanel.tsx`
- Modify: `src/components/layout/CampusExplorer.tsx` (selection branching)
- Test: `src/lib/__tests__/building-catalog.test.ts`

**Interfaces:**
- Produces: `PinTier`, `BuildingCategory`, `getBuildingCatalogEntry(id)`, `resolvePinTier(id)`, `displayBuildingName(id, fallback)`
- Consumes: geojson `building_id`s, seed building ids

- [ ] **Step 1: Write failing catalog tests**

```ts
import { describe, expect, it } from "vitest";
import { resolvePinTier, resolveCategory, displayBuildingName } from "@/lib/building-catalog";

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
    expect(displayBuildingName("la-davis-student-union", "L.A. David Sr. Student Union")).toMatch(/Davis/);
  });

  it("categorizes housing", () => {
    expect(resolveCategory("delta-housing-complex")).toBe("Housing");
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `pnpm test`
Expected: FAIL module not found

- [ ] **Step 3: Implement `building-catalog.ts`**

Curate explicitly. Primary = research/academic hubs used by the research map:

```ts
export type PinTier = "primary" | "secondary";
export type BuildingCategory =
  | "Research"
  | "Academic"
  | "Housing"
  | "Recreation"
  | "Administration"
  | "Student Life"
  | "Other";

type Entry = {
  pinTier: PinTier;
  category: BuildingCategory;
  name?: string;
  shortDescription?: string;
};

const CATALOG: Record<string, Entry> = {
  "stem-building": { pinTier: "primary", category: "Research" },
  "walker-research-center": { pinTier: "primary", category: "Research" },
  "parker-ag-research": { pinTier: "primary", category: "Research" },
  "parker-1890-complex": { pinTier: "primary", category: "Research" },
  "caldwell-hall": { pinTier: "primary", category: "Academic", name: "Caldwell Hall" },
  "woodward-hall": { pinTier: "primary", category: "Academic" },
  "john-b-watson-library": { pinTier: "primary", category: "Academic" },
  "rust-technology-building": { pinTier: "primary", category: "Academic" },
  "human-sciences-building": { pinTier: "primary", category: "Academic" },
  "henderson-young-hall": { pinTier: "primary", category: "Academic" },
  "caine-gilleland-hall": { pinTier: "primary", category: "Academic" },
  "dawson-hicks-hall": { pinTier: "primary", category: "Academic" },
  "corbin-hall": { pinTier: "primary", category: "Academic" },
  "larrison-hall": { pinTier: "primary", category: "Academic" },
  // secondary examples
  "holiday-hall": { pinTier: "secondary", category: "Housing", shortDescription: "Residential and administrative hall." },
  "delta-housing-complex": { pinTier: "secondary", category: "Housing", shortDescription: "Campus residential housing complex." },
  "johnny-b-johnson-housing-complex": { pinTier: "secondary", category: "Housing", shortDescription: "Campus residential housing complex." },
  "fitness-center": { pinTier: "secondary", category: "Recreation" },
  "health-physical-education-and-recreation-hper-building": { pinTier: "secondary", category: "Recreation" },
  "alumni-house": { pinTier: "secondary", category: "Administration" },
  "administration-building": { pinTier: "secondary", category: "Administration" },
  "facilities-management": { pinTier: "secondary", category: "Administration" },
  "la-davis-student-union": {
    pinTier: "secondary",
    category: "Student Life",
    name: "L.A. Davis, Sr. Student Union",
  },
  "w-e-o-bryant-bell-tower": { pinTier: "secondary", category: "Other" },
  "child-development-center": { pinTier: "secondary", category: "Other" },
  "infirmary-building": { pinTier: "secondary", category: "Other" },
  "hazzard-building-military-science": { pinTier: "secondary", category: "Academic" },
  "harrold-complex": { pinTier: "secondary", category: "Other" },
  "lewis-hall": { pinTier: "secondary", category: "Housing" },
  "douglas-hall": { pinTier: "secondary", category: "Housing" },
  "childress-hall": { pinTier: "secondary", category: "Housing" },
};

export function resolvePinTier(id: string): PinTier {
  return CATALOG[id]?.pinTier ?? "secondary";
}

export function resolveCategory(id: string): BuildingCategory {
  return CATALOG[id]?.category ?? "Other";
}

export function displayBuildingName(id: string, fallback: string): string {
  return CATALOG[id]?.name ?? fallback;
}

export function shortDescriptionFor(id: string, fallback?: string | null): string {
  return CATALOG[id]?.shortDescription ?? fallback ?? "Campus building.";
}

export function pinPriority(id: string): number {
  return resolvePinTier(id) === "primary" ? 1 : 100;
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `pnpm test`

- [ ] **Step 5: Enrich pin GeoJSON properties in `buildPinFeatureCollection`**

```ts
properties: {
  building_id: meta.id,
  name: displayBuildingName(meta.id, meta.name),
  code: meta.code,
  pin_tier: resolvePinTier(meta.id),
  category: resolveCategory(meta.id),
  priority: pinPriority(meta.id),
}
```

- [ ] **Step 6: Split pin layers**

Keep `LAYER_PINS` for primary (`filter: ["==", ["get", "pin_tier"], "primary"]`).
Add `LAYER_PINS_SECONDARY` with muted icon (`PIN_SECONDARY`), smaller size, `minzoom: SECONDARY_PIN_MIN_ZOOM`, same click handlers.
Selected layer works for either tier.
Register a second pin image `uapb-pin-secondary` (same SVG, gray fill).

When prop `showAllCampusBuildings === true`, set secondary layer `minzoom` to `0` (or remove minzoom via `setLayerZoomRange`).

- [ ] **Step 7: `PlaceDetailPanel.tsx` for secondary**

Compact panel: name, category badge, short description, Directions button, “View on Google Maps” link. **No** Research Projects / Researchers sections.

- [ ] **Step 8: Branch detail in explorer / LeftPanel**

If `resolvePinTier(selectedId) === "secondary"` → `PlaceDetailPanel`; else → `BuildingDetailPanel`.

Locations list: default filter `pinTier === "primary"` using catalog on each building id; checkbox/toggle “All campus buildings” includes secondary (also drives map prop).

For geojson-only secondary buildings not in `buildings` API array, still allow selection via `selectedMeta` + PlaceDetailPanel (already partially supported).

- [ ] **Step 9: Manual check**

At zoom ~16: primary gold pins dominate; dorms hidden or sparse.
Zoom ≥16.5 or enable “All campus buildings”: secondary gray pins appear; click dorm → place card without empty research UI.

- [ ] **Step 10: Commit**

```bash
git add src/lib/building-catalog.ts src/lib/__tests__/building-catalog.test.ts \
  src/components/layout/PlaceDetailPanel.tsx \
  src/components/map/CampusMap.tsx \
  src/components/layout/LeftPanel.tsx \
  src/components/layout/CampusExplorer.tsx \
  src/components/layout/BuildingDetailPanel.tsx
git commit -m "$(cat <<'EOF'
feat: primary and secondary campus building pins

Curate pin tiers so research hubs lead; housing and amenities use
muted zoom-gated pins with a compact place card.
EOF
)"
```

---

### Task 3: Zoom / camera UX polish

**Files:**
- Modify: `src/components/map/CampusMap.tsx` (`fitCampusView`, unified camera effect, zoom buttons)
- Consumes: `cameraDuration`, `prefersReducedMotion`, zoom constants from Task 1

- [ ] **Step 1: Centralize duration helper usage**

Replace hard-coded `duration: 600|900|250` with:

```ts
const reduced = prefersReducedMotion();
duration: cameraDuration(600, reduced)
```

- [ ] **Step 2: Fix `fitCampusView`**

- Use `mainCampusFitBounds`
- `maxZoom: BUILDING_FOCUS_ZOOM` (18) on fit is OK, but do **not** force ease back to 15.8
- Remove or relax `enforceMinZoom` that re-zooms to `CAMPUS_MIN_ZOOM = 15.8` (old behavior); after Task 1 min is 14 — only enforce if fit somehow goes below `CAMPUS_MIN_ZOOM`

- [ ] **Step 3: Cancel stale `moveend` listeners**

When starting a new `fitCampusView` / `flyTo`, store a token; in `moveend` callbacks, no-op if token mismatch. Clear previous `once("moveend")` where possible.

- [ ] **Step 4: Zoom buttons**

```ts
map.zoomIn({ duration: cameraDuration(250, prefersReducedMotion()) });
map.zoomOut({ duration: cameraDuration(250, prefersReducedMotion()) });
```

- [ ] **Step 5: Manual check**

Wheel/buttons from neighborhood (~14) to building (~19); Campus home fits campus; reduced-motion (OS setting) jumps instantly.

- [ ] **Step 6: Commit**

```bash
git add src/components/map/CampusMap.tsx
git commit -m "$(cat <<'EOF'
fix: campus-first zoom range and smoother camera motion

Widen interactive zoom, honor reduced motion, and stop competing
fitBounds follow-ups from fighting the user.
EOF
)"
```

---

### Task 4: Warm map shell (persist MapLibre across directory)

**Files:**
- Create: `src/components/layout/ExplorerShell.tsx`
- Create: `src/app/(shell)/layout.tsx`
- Create: `src/app/(shell)/page.tsx`
- Create: `src/app/(shell)/directory/page.tsx`
- Modify: `src/components/layout/CampusExplorer.tsx` (thin map body or merge into shell)
- Modify: `src/components/directory/PeopleDirectory.tsx` (no duplicate header; accept `embedded` prop)
- Delete: `src/app/page.tsx`, `src/app/directory/page.tsx`
- Read first: `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`

**Interfaces:**
- `ExplorerShell` always mounts `CampusMap` once; toggles visibility via `usePathname()`
- Directory page renders as `children` above/full viewport without unmounting map

- [ ] **Step 1: Create route group layout**

```tsx
// src/app/(shell)/layout.tsx
import ExplorerShell from "@/components/layout/ExplorerShell";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return <ExplorerShell>{children}</ExplorerShell>;
}
```

- [ ] **Step 2: Implement `ExplorerShell`**

Client component that:
1. Owns buildings/researchers fetch + map selection/route state currently in `CampusExplorer` **or** renders existing `CampusExplorer` always and overlays directory.
2. Prefer **minimal move**: always render map explorer tree; when `pathname.startsWith("/directory")`, apply `invisible pointer-events-none` (not `display:none` if it breaks MapLibre size — prefer `visibility:hidden` + `aria-hidden` on map chrome, keep map `position:absolute inset-0` mounted) and show `{children}` as full-screen directory.
3. Single shared `AppHeader` with `active` derived from pathname; `onHomeClick` only when on map.

Recommended structure:

```tsx
"use client";
import { usePathname } from "next/navigation";
// ...
const onDirectory = pathname.startsWith("/directory");
return (
  <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50">
    <AppHeader active={onDirectory ? "directory" : "map"} onHomeClick={...} rightSlot={...} />
    <div className="relative flex-1 min-h-0">
      <div className={onDirectory ? "invisible pointer-events-none absolute inset-0" : "absolute inset-0"} aria-hidden={onDirectory}>
        {/* existing CampusExplorer body WITHOUT its own header */}
      </div>
      {onDirectory ? <div className="absolute inset-0 z-10 bg-gray-50 overflow-auto">{children}</div> : null}
    </div>
  </div>
);
```

- [ ] **Step 3: Route pages**

```tsx
// src/app/(shell)/page.tsx
export default function MapPage() {
  return null; // shell shows map
}

// src/app/(shell)/directory/page.tsx
import PeopleDirectory from "@/components/directory/PeopleDirectory";
export default function DirectoryPage() {
  return <PeopleDirectory embedded />;
}
```

- [ ] **Step 4: Strip duplicate chrome**

- Remove outer header from `CampusExplorer` when used under shell (prop `hideHeader` or refactor so only shell owns header).
- `PeopleDirectory`: if `embedded`, do not render `AppHeader` or full `h-screen` wrapper — just main content.

- [ ] **Step 5: Delete old routes**

Delete `src/app/page.tsx` and `src/app/directory/page.tsx` so `(shell)` owns `/` and `/directory`.

- [ ] **Step 6: Manual check**

Open `/`, wait for map tiles. Navigate to Faculty & Researchers. Navigate back to Campus Map.
Expected: **no** “Loading map…” cold remount; map appears immediately with prior camera.

- [ ] **Step 7: Commit**

```bash
git add src/app/\(shell\) src/components/layout/ExplorerShell.tsx \
  src/components/layout/CampusExplorer.tsx \
  src/components/directory/PeopleDirectory.tsx
git rm src/app/page.tsx src/app/directory/page.tsx
git commit -m "$(cat <<'EOF'
feat: persist MapLibre across Faculty & Researchers navigation

Introduce a shared shell layout so the campus map stays warm when
switching to the directory and back.
EOF
)"
```

---

### Task 5: In-map transitions + directions pin behavior

**Files:**
- Modify: `src/components/layout/LeftPanel.tsx`
- Modify: `src/components/layout/CampusExplorer.tsx` (or shell)
- Modify: `src/app/globals.css` (optional reduced-motion utilities)

- [ ] **Step 1: Single animated panel shell**

Replace early-return collapsed `<div className="w-12">` with one `<aside>`:

```tsx
<aside
  className={`shrink-0 h-full border-r border-gray-200 bg-white flex flex-col transition-[width] duration-300 ease-out ${
    collapsed ? "w-12" : "w-100"
  } motion-reduce:transition-none`}
>
  {collapsed ? <CollapsedRail ... /> : <ExpandedContent ... />}
</aside>
```

Keep width tokens aligned with `LEFT_PANEL_W` / `LEFT_COLLAPSED_W` (use same numbers: 400 / 48).

- [ ] **Step 2: Soften list ↔ detail swap**

Wrap detail/list in a container with `animate-in fade` via Tailwind opacity transition (`transition-opacity duration-200`), skeleton only for async research fetch.

- [ ] **Step 3: Fix pin click vs Directions**

In `handleSelectBuilding`:

```ts
setSelectedId(id);
setSelectedMeta(meta ?? null);
if (sidebarTab !== "directions") {
  setSidebarTab("locations");
} else {
  // fill empty endpoint instead of destroying directions
  if (!fromId) setFromId(id);
  else if (!toId && id !== fromId) setToId(id);
}
if (panelCollapsed) setPanelCollapsed(false);
```

Only force `locations` when user explicitly opens detail from Locations list or primary “view research” path. For secondary place card from Directions, keep tab.

Clarify UX: clicking pin while on Directions fills From/To; double-click or “View details” opens Locations detail. Minimal approach matching spec: if on Directions, fill endpoints and **do not** switch tab; provide “View details” on tooltip/place card to switch.

- [ ] **Step 4: Header selection chip**

Wrap chip in `transition-opacity` container that stays mounted with `opacity-0` when empty to avoid layout jump, or reserve min-width.

- [ ] **Step 5: Manual check**

Collapse/expand panel — width animates with map padding. On Directions tab, click two buildings — both fields fill; route builder remains.

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/LeftPanel.tsx \
  src/components/layout/CampusExplorer.tsx \
  src/components/layout/ExplorerShell.tsx \
  src/app/globals.css
git commit -m "$(cat <<'EOF'
fix: smooth sidebar transitions and directions pin fill

Animate panel width with the map and stop pin clicks from wiping
an in-progress route.
EOF
)"
```

---

### Task 6: Faculty & Researchers directory page

**Files:**
- Create: `src/lib/ui-copy.ts`
- Modify: `src/components/layout/AppHeader.tsx`
- Modify: `src/components/directory/PeopleDirectory.tsx`
- Modify: `src/components/directory/ProfileCard.tsx`
- Modify: `src/components/directory/ProfileModal.tsx`
- Grep/fix: any remaining “People Directory” strings (README optional; AI comments optional per non-goals — fix user-facing only)

- [ ] **Step 1: Add `ui-copy.ts`**

```ts
export const NAV_FACULTY = "Faculty & Researchers";
export const NAV_MAP = "Campus Map";
export const DIRECTORY_TITLE = "Faculty & Researchers";
export const DIRECTORY_SUBTITLE =
  "Search faculty and researchers by name, department, or expertise.";
export const DIRECTORY_SEARCH_PLACEHOLDER =
  "Search by name, title, department, or expertise…";
export const DIRECTORY_EMPTY = "No matching faculty or researchers";
export const DIRECTORY_RESULT_COUNT = (n: number) =>
  `Showing ${n} ${n === 1 ? "person" : "people"}`;
export const PROFILE_VIEW = "View profile";
export const PROFILE_VIEW_ON_MAP = "View on campus map";
```

- [ ] **Step 2: Wire header**

Replace `People Directory` with `{NAV_FACULTY}` from `ui-copy`.

- [ ] **Step 3: Redesign directory main**

In `PeopleDirectory`:
- Title/subtitle from `ui-copy`
- Controls row: search + department + **Grid | List** toggle state
- Show `DIRECTORY_RESULT_COUNT(filtered.length)`
- Empty state: `DIRECTORY_EMPTY` + button “Clear filters”
- Grid: existing cards
- List: denser rows — avatar/initials, name, title, department, email mailto; click opens profile
- `ProfileCard` CTA → `PROFILE_VIEW`
- `ProfileModal` building link label → `PROFILE_VIEW_ON_MAP` (keep `href=/?building=...`)

Visual: keep UAPB gold accents; avoid new hero; generous whitespace; `max-w-5xl` or `max-w-6xl` content column.

- [ ] **Step 4: Manual check**

`/directory` reads as a university faculty directory; grid/list both work; profile → View on campus map focuses building on warm map.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ui-copy.ts \
  src/components/layout/AppHeader.tsx \
  src/components/directory/PeopleDirectory.tsx \
  src/components/directory/ProfileCard.tsx \
  src/components/directory/ProfileModal.tsx
git commit -m "$(cat <<'EOF'
feat: professional Faculty & Researchers directory

Rename nav/copy and add grid/list directory patterns aligned with
standard university research directories.
EOF
)"
```

---

### Task 7: Regression sweep + lint/build

**Files:** touch only if fixes needed

- [ ] **Step 1: Grep user-facing leftovers**

```bash
rg -n "People Directory" src/
```

Expected: no user-facing matches (comments in seeds OK to update if trivial).

- [ ] **Step 2: Run automated checks**

```bash
pnpm test
pnpm lint
pnpm build
```

Expected: all pass.

- [ ] **Step 3: Manual checklist (from spec)**

1. Mask opaque outside campus; satellite inside; off-campus holes OK  
2. Zoom ~14–19; home; building focus; reduced motion  
3. Primary/secondary pins + place card  
4. `/` → `/directory` → `/` without cold map reload  
5. Directory search/department/grid/list/profile/map link  
6. Directions endpoint fill + primary research detail  
7. `/?building=stem-building` deep link  

- [ ] **Step 4: Final commit only if fixes landed**

```bash
git add -A
git status
# commit only if there are fixups
git commit -m "$(cat <<'EOF'
fix: address map UX regression sweep findings
EOF
)"
```

---

## Self-review (plan vs spec)

| Spec section | Task(s) |
| --- | --- |
| §1 Opaque campus satellite / main-campus hull | Task 1 |
| §2 Primary/secondary pins + place card + list filter | Task 2 |
| §3 Zoom/camera/controls | Task 1 constants + Task 3 |
| §4 Warm shell + in-map transitions + directions pins | Tasks 4–5 |
| §5 Faculty & Researchers directory | Task 6 |
| §6 DRY / no Cesium / regression guardrails | Tasks 1–2 extracts + Task 7 |

No TBD placeholders. Types (`PinTier`, map-config exports) are consistent across tasks. Vitest covers pure logic only; MapLibre verified manually.
