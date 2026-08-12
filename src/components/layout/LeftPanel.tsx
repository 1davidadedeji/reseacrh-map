"use client";

import { useMemo, useRef, useEffect } from "react";
import type { Building } from "@/types";
import DirectionsPanel from "@/components/layout/DirectionsPanel";
import BuildingDetailPanel from "@/components/layout/BuildingDetailPanel";
import PlaceDetailPanel from "@/components/layout/PlaceDetailPanel";
import { sortBuildingsWithPhotosFirst } from "@/lib/building-media";
import { displayBuildingName, resolvePinTier } from "@/lib/building-catalog";
import { IconDirections } from "@/components/building/MediaIcons";
import type { DirectionsResult } from "@/lib/directions";
import type { UserLocation } from "@/components/map/CampusMap";
import type { GeoJsonBuildingMeta } from "@/types/building-selection";

export type SidebarTab = "locations" | "directions";

interface LeftPanelProps {
  buildings: Building[];
  selectedId: string | null;
  selectedMeta?: GeoJsonBuildingMeta | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectBuilding: (id: string) => void;
  onClearSelection: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  route: DirectionsResult | null;
  onRouteChange: (route: DirectionsResult | null) => void;
  userLocation: UserLocation | null;
  onUserLocationChange: (loc: UserLocation | null) => void;
  onStepFocus: (location: [number, number]) => void;
  tab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  fromId: string;
  toId: string;
  onFromIdChange: (id: string) => void;
  onToIdChange: (id: string) => void;
  onGetDirections: (buildingId: string) => void;
  onResearcherClick: (researcherId: string) => void;
  showAllCampusBuildings: boolean;
  onShowAllCampusBuildingsChange: (value: boolean) => void;
}

function BuildingRow({
  building,
  selected,
  onClick,
}: {
  building: Building;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-id={building.id}
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-gray-100 flex items-start gap-3 transition-all group ${
        selected
          ? "bg-amber-50 border-l-2 border-l-[#EEB310]"
          : "hover:bg-gray-50"
      }`}
    >
      {building.image_url ? (
        <div className="mt-0.5 h-9 w-9 shrink-0 rounded-lg overflow-hidden bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={building.image_url} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <span
          className={`mt-1.5 h-2 w-2 rounded-full shrink-0 bg-[#EEB310] ${
            selected ? "ring-2 ring-[#EEB310]/40 ring-offset-1" : "opacity-50"
          }`}
        />
      )}
      <div className="min-w-0 flex-1">
        <p
          className={`text-[13px] font-medium leading-snug truncate ${
            selected ? "text-amber-700" : "text-gray-800 group-hover:text-gray-900"
          }`}
        >
          {building.name}
        </p>
        <p className="text-[11px] text-gray-400 mt-0.5 font-mono">{building.code}</p>
      </div>
    </button>
  );
}

export default function LeftPanel({
  buildings,
  selectedId,
  selectedMeta = null,
  searchQuery,
  onSearchChange,
  onSelectBuilding,
  onClearSelection,
  collapsed,
  onToggleCollapse,
  route,
  onRouteChange,
  userLocation,
  onUserLocationChange,
  onStepFocus,
  tab,
  onTabChange,
  fromId,
  toId,
  onFromIdChange,
  onToIdChange,
  onGetDirections,
  onResearcherClick,
  showAllCampusBuildings,
  onShowAllCampusBuildingsChange,
}: LeftPanelProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const selectedBuilding = buildings.find((b) => b.id === selectedId) ?? null;
  const selectedIsSecondary = selectedId ? resolvePinTier(selectedId) === "secondary" : false;

  useEffect(() => {
    if (!selectedId || !listRef.current || tab !== "locations") return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-id="${selectedId}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedId, tab]);

  const filtered = useMemo(() => {
    const scoped = showAllCampusBuildings
      ? buildings
      : buildings.filter((b) => resolvePinTier(b.id) === "primary");
    const q = searchQuery.toLowerCase().trim();
    const list = q
      ? scoped.filter(
          (b) =>
            b.name.toLowerCase().includes(q) ||
            b.code.toLowerCase().includes(q) ||
            b.description?.toLowerCase().includes(q)
        )
      : scoped;

    return sortBuildingsWithPhotosFirst(list);
  }, [buildings, searchQuery, showAllCampusBuildings]);

  const showDetail = tab === "locations" && selectedId;

  return (
    <aside
      className={`h-full flex flex-col border-r border-gray-200 shrink-0 shadow-sm z-10 overflow-hidden transition-[width] duration-300 ease-out motion-reduce:transition-none ${
        collapsed
          ? "w-12 bg-white"
          : "w-[min(100vw,380px)] sm:w-100 bg-[#f1f1f1]"
      }`}
    >
      {collapsed ? (
        <div className="h-full flex flex-col items-center py-4 gap-4">
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Expand panel"
            className="p-2 rounded-lg text-gray-400 hover:text-[#EEB310] hover:bg-amber-50 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => {
              onTabChange("directions");
              onToggleCollapse();
            }}
            title="Directions"
            className="p-2 rounded-lg text-gray-400 hover:text-[#EEB310] hover:bg-amber-50 transition-colors"
          >
            <IconDirections className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
      {/* Search + directions peer row */}
      <div className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 bg-white border-b border-gray-200">
        <div className="relative flex-1 min-w-0">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search buildings…"
            className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-[12px] text-gray-800 placeholder-gray-400 outline-none focus:border-[#EEB310] focus:bg-white transition-all"
          />
        </div>
        <button
          type="button"
          onClick={() => onTabChange("directions")}
          title="Directions"
          className={`shrink-0 h-9 w-9 rounded-lg flex items-center justify-center transition-colors ${
            tab === "directions"
              ? "bg-[#EEB310] text-gray-900"
              : "bg-gray-50 border border-gray-200 text-gray-500 hover:border-amber-300 hover:text-[#EEB310]"
          }`}
        >
          <IconDirections className="h-4 w-4" onGold={tab === "directions"} />
        </button>
        <button
          type="button"
          onClick={onToggleCollapse}
          title="Collapse panel"
          className="shrink-0 h-9 w-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Campus hero + tabs */}
      <div className="relative shrink-0 h-28 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/uapb-campus-illustrated.png"
          alt="UAPB campus aerial view"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 flex">
          {(["locations", "directions"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => onTabChange(t)}
              className={`flex-1 py-2.5 text-[12px] font-semibold transition-colors border-b-2 ${
                tab === t
                  ? "text-white border-white/90 bg-black/20"
                  : "text-white/60 border-transparent hover:text-white/90"
              }`}
            >
              {t === "locations" ? "Locations" : "Directions"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 flex flex-col bg-white">
        {tab === "directions" ? (
          <DirectionsPanel
            buildings={buildings}
            selectedId={selectedId}
            route={route}
            onRouteChange={onRouteChange}
            userLocation={userLocation}
            onUserLocationChange={onUserLocationChange}
            onStepFocus={onStepFocus}
            fromId={fromId}
            toId={toId}
            onFromIdChange={onFromIdChange}
            onToIdChange={onToIdChange}
          />
        ) : showDetail && selectedId && selectedIsSecondary ? (
          <PlaceDetailPanel
            buildingId={selectedId}
            building={selectedBuilding}
            meta={selectedMeta}
            onBack={onClearSelection}
            onGetDirections={onGetDirections}
          />
        ) : showDetail && selectedId ? (
          <BuildingDetailPanel
            buildingId={selectedId}
            displayName={displayBuildingName(
              selectedId,
              selectedBuilding?.name ?? selectedMeta?.name ?? selectedId,
            )}
            displayCode={selectedBuilding?.code ?? selectedMeta?.code}
            building={selectedBuilding}
            onBack={onClearSelection}
            onGetDirections={onGetDirections}
            onResearcherClick={onResearcherClick}
          />
        ) : (
          <>
            <div className="shrink-0 flex border-b border-gray-100 bg-gray-50">
              <div className="flex-1 py-2 text-center">
                <p className="text-sm font-bold text-[#EEB310]">{filtered.length}</p>
                <p className="text-[9px] uppercase tracking-wider text-gray-400">
                  {showAllCampusBuildings ? "Campus" : "Research"}
                </p>
              </div>
              <div className="flex-1 py-2 text-center border-l border-gray-100">
                <p className="text-sm font-bold text-[#EEB310]">{filtered.length}</p>
                <p className="text-[9px] uppercase tracking-wider text-gray-400">
                  {searchQuery ? "Matches" : "Listed"}
                </p>
              </div>
            </div>

            <label className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-gray-100 text-[11px] text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showAllCampusBuildings}
                onChange={(e) => onShowAllCampusBuildingsChange(e.target.checked)}
                className="rounded border-gray-300 text-amber-600 focus:ring-[#EEB310]"
              />
              All campus buildings
            </label>

            <div ref={listRef} className="flex-1 overflow-y-auto min-h-0">
              {buildings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 px-4 text-center">
                  <div className="h-6 w-24 bg-gray-100 rounded animate-pulse mb-1" />
                  <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2.5 px-4 text-center">
                  <p className="text-[12px] text-gray-400">No results found</p>
                  <button
                    type="button"
                    onClick={() => onSearchChange("")}
                    className="text-[11px] font-semibold text-[#EEB310] hover:text-amber-600 transition-colors"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                filtered.map((b) => (
                  <BuildingRow
                    key={b.id}
                    building={b}
                    selected={b.id === selectedId}
                    onClick={() => onSelectBuilding(b.id)}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>

      <div className="shrink-0 px-4 py-2 border-t border-gray-200 bg-[#f1f1f1]">
        <p className="text-[9px] text-gray-400 text-center">
          University of Arkansas at Pine Bluff · Research Office
        </p>
      </div>
        </>
      )}
    </aside>
  );
}
