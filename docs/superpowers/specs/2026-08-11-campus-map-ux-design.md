# Campus Map UX & Directory Professionalization — Design Spec

**Date:** 2026-08-11  
**Status:** Approved for planning  
**Approach:** Targeted UX hardening (no rewrite, no new 3D stack)

## Problem

The UAPB Research Map feels unpolished:

1. Campus “hole-out” looks like a translucent overlay; surroundings read as satellite/3D instead of a clean flat basemap.
2. Navigation and panel transitions hard-cut (especially `/` ↔ `/directory`, which remounts MapLibre).
3. Zoom defaults are too tight (~15.8–18); camera and sidebar animations fight each other.
4. All buildings share the same research-style pin, including dorms and non-research facilities.
5. Copy such as “People Directory” does not match university directory norms (uapb.edu uses Directory; peers use Faculty / Faculty & Researchers).
6. Code concentration in `CampusMap.tsx` and duplicated layout constants invite churn and regression.

## Goals

- Satellite aerial **only** inside campus property (plus known off-campus research sites); **opaque** flat basemap everywhere else.
- Research buildings = primary pins; other campus buildings = secondary (muted, zoom-gated).
- Campus-first zoom (~14–19) with soft geographic bounds.
- Warm map shell: leaving for Faculty & Researchers does not destroy the map instance.
- Professional Faculty & Researchers directory (search, department filter, grid/list, standard profile).
- DRY extractions helpers/constants; no Cesium/3D rewrite; avoid unrelated refactors.

## Non-goals

- True 3D building extrusions or Cesium.
- Dual synced maps.
- Live OSM scraping at runtime.
- Full university HR directory (staff, departments CRM).
- Deleting `public/cesium/` in this pass (optional follow-up).
- Rewriting the AI assistant beyond copy alignment.

## Decisions (locked)

| Topic | Choice |
| --- | --- |
| Non-research buildings | **B** — Secondary muted pins; appear mainly when zoomed in / when “All campus buildings” is on |
| Campus vs surroundings | **A** — Satellite inside campus; clean 2D basemap outside |
| Directory label | **B** — Faculty & Researchers |
| Zoom behavior | **A** — Campus-first; ~14–19; soft maxBounds |
| Route transitions | **C** — Shared layout keeps MapLibre warm across `/directory` |
| Implementation style | **1** — Targeted hardening, not rewrite |

---

## §1 — Campus satellite vs surrounding basemap

### Behavior

- Only campus property (main-campus footprint hull) and buffered off-campus research sites show MapTiler satellite.
- Outside holes: solid basemap paper (no ghosted roads, no see-through satellite).

### Technique

Keep MapLibre pattern: full-viewport satellite raster + world polygon with clockwise hole rings.

Changes:

1. `MASK_OPACITY = 1.0` (today `0.92` causes bleed-through).
2. Mask `fill-color` continues to match the loaded basemap background color.
3. Layer order unchanged: satellite + mask above roads, below labels.
4. Campus hole computed from **main-campus features only** (reuse ~1.2 km radius filter used for home fit) so outliers do not inflate the hull.
5. Off-campus research sites remain separate buffered holes; overlapping zones stay dissolved.
6. Keep light gold zone outline as a property-boundary cue (not a heavy frame).

### Success criteria

- Outside campus: no visible satellite or road ghosting through the mask.
- Inside campus: satellite unchanged in quality; labels/pins still readable.
- Off-campus research sites still punched out cleanly.

---

## §2 — Building pins (primary vs secondary)

### Tiers

| Tier | Examples | Presentation |
| --- | --- | --- |
| **Primary** | STEM, Caldwell, Walker Research, Parker Ag, research-linked academic hubs | Full gold pin; high symbol priority; always in default Locations list |
| **Secondary** | Housing complexes, fitness, alumni house, facilities, bell tower, etc. | Smaller muted pin; `minzoom` ~16.5; lower sort priority |

### Interaction

- **Primary click** → existing research building detail (projects, researchers, media).
- **Secondary click** → compact place card: official name, category (Housing, Recreation, Administration, …), short description, Directions / Open in Google Maps. **No** empty Research Projects section.
- Locations list defaults to primary; optional control: **All campus buildings** includes secondary.

### Data

- Add typed `pinTier` (`"primary" | "secondary"`) and `category` on building metadata (seed + geojson merge path).
- Single source of truth consumed by map filters, sidebar, and detail branching.
- Secondary descriptions from curated OSM/geojson names + category map — do not invent grants/research for dorms.
- Fix known name typos when touching data (e.g. L.A. Davis spelling, Caldwell Hall casing).

### Success criteria

- At default campus zoom, primary pins dominate; secondary appear when zooming in (or when filter enabled).
- Secondary detail never shows empty research chrome.
- Primary research flow unchanged.

---

## §3 — Zoom, camera, and map controls

### Defaults

| Setting | Value |
| --- | --- |
| Initial view | Fit main campus with left-panel padding |
| Min / max zoom | ~14 / ~19 |
| Building focus | ~18 |
| Route step focus | ~19 |
| Geographic limit | Soft `maxBounds` around Pine Bluff / campus vicinity |
| Campus home | Fit main campus |

### Feel

- One camera owner; invalidate/cancel stale `flyTo` / `fitBounds`.
- Zoom ±: short consistent duration; if `prefers-reduced-motion: reduce`, use duration `0`.
- Sidebar collapse and camera padding animate together (no jump-cut panel + sliding map).
- Resize: debounced; refit only when idle (no selection/route).
- Controls: Campus home / Zoom ± / My location only; no pitch/rotate (stay top-down 2D).

### Success criteria

- User can zoom out enough to see neighborhood context and in enough for building detail without feeling trapped.
- Home reset and building focus feel continuous, not stuttered.
- Reduced-motion users get instant camera updates.

---

## §4 — Navigation & transitions (warm map shell)

### Route shell

- Shared layout hosts a **persistent MapLibre host** for the map experience.
- Navigating to `/directory` does **not** call `map.remove()` / remount — map stays mounted and hidden/inert; return to `/` is instant (no “Loading map…” cold start).
- Shared header: **Campus Map** | **Faculty & Researchers**; logo resets home when already on map route.

### In-map transitions

- Left panel: single width-animated shell (collapsed ↔ expanded).
- List ↔ building detail: short crossfade/slide; skeleton only for async research fetch.
- Pin click while on Directions: do **not** destroy the route builder; fill empty From/To; switch to Locations only when opening research/place detail intentionally.
- Header selection chip fades without layout jump.
- UI fades respect `prefers-reduced-motion`.

### Success criteria

- Round-trip `/` → `/directory` → `/` does not reload tiles from a cold map.
- Sidebar and map padding stay visually synchronized.
- Directions drafting is not wiped by incidental pin clicks meant to set endpoints.

---

## §5 — Faculty & Researchers page

### Information architecture

Inspired by common university patterns (e.g. Illinois Grainger Faculty directory, UW faculty filters, UMN college directories) and uapb.edu **Directory** naming:

- Title: **Faculty & Researchers**
- Subtitle: “Search faculty and researchers by name, department, or expertise.”
- Controls: live search, department filter, grid | list toggle
- Result count: “Showing N people”
- Empty: “No matching faculty or researchers” + reset filters

### Profile

- Modal/drawer: photo, title, department, email, specializations, publications/awards when present
- CTA: **View profile**
- If building known: **View on campus map** → `/?building=<id>`

### Visual & copy

- Clean academic directory under existing UAPB gold/navy language — not a marketing landing page
- No hero clutter; the page *is* the directory
- Replace all user-facing “People Directory” with **Faculty & Researchers**
- Align AI/chat strings if they still say People Directory

### Success criteria

- Page reads as a standard faculty/researcher directory at a glance.
- Grid and list both usable on mobile and desktop.
- Building deep link from profile still focuses the correct primary building on the map.

---

## §6 — Code hygiene

### Extract

- Map camera/zoom/bounds/padding constants → shared `map-config` (or extend `src/lib/geo.ts`).
- Mask/zone helpers → focused module beside the map component.
- Nav/directory label strings → one small copy module.
- `pinTier` / `category` typed metadata as single source for map, sidebar, detail.

### Explicitly avoid

- Cesium / Three / deck.gl introduction
- Expanding dead `BuildingSidebar` (leave unused or delete only if clearly orphaned and safe)
- Drive-by refactors outside map / shell / directory / related data
- Infinite polish loops: ship against success criteria above

### Regression guardrails

Preserve: directions (Mapbox), `?building=` deep links, AI assistant mount, primary building research detail and media gallery.

---

## Architecture sketch

```text
App shell (shared layout)
├── AppHeader (Campus Map | Faculty & Researchers)
├── Persistent MapHost (MapLibre; visible on / ; hidden/inert on /directory)
│   ├── satellite + opaque mask (campus + off-campus holes)
│   ├── primary pins / secondary pins
│   └── route layers
├── LeftPanel (map route only)
│   ├── Locations (primary default; optional all-campus)
│   ├── Directions
│   └── BuildingDetail | PlaceCard (by pinTier)
└── FacultyResearchersPage (/directory)
    ├── search + department + grid/list
    └── Profile modal → optional map deep link
```

## Key files (expected touch set)

- `src/components/map/CampusMap.tsx` (+ extracted mask/config helpers)
- `src/components/layout/CampusExplorer.tsx`, `LeftPanel.tsx`, `AppHeader.tsx`, `BuildingDetailPanel.tsx`
- `src/app/layout.tsx` and/or new shared shell under `src/components/layout/`
- `src/app/directory/page.tsx`, `src/components/directory/*`
- Building seed/geojson metadata for `pinTier` / `category`
- Copy strings in header/directory/chat as needed

## Testing checklist

1. Mask: pan outside campus — solid basemap, no satellite bleed; campus satellite intact.
2. Zoom: wheel/buttons from ~14–19; home fit; building focus; reduced-motion instant.
3. Pins: primary always; secondary at high zoom / all-campus filter; place card has no research empties.
4. Nav: `/` → `/directory` → `/` without cold map reload.
5. Directory: search, department, grid/list, profile, “View on campus map”.
6. Directions: build a route; pin-fill endpoints; primary research open still works.
7. Deep link: `/?building=<primary-id>` focuses and opens detail.

## Open follow-ups (not this pass)

- Remove dead `public/cesium/` assets to shrink deploy size.
- Optional secondary-building photos from a curated set (not live scrape).
- True fill-extrusion 3D if product later wants massing.
