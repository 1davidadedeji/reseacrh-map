"use client";

import { useMemo, useRef, useEffect } from "react";
import type { Building } from "@/types";

interface LeftPanelProps {
  buildings: Building[];
  selectedId: string | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectBuilding: (id: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
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
      <span
        className={`mt-1.5 h-2 w-2 rounded-full shrink-0 bg-[#EEB310] ${
          selected ? "ring-2 ring-[#EEB310]/40 ring-offset-1" : "opacity-50"
        }`}
      />
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
  searchQuery,
  onSearchChange,
  onSelectBuilding,
  collapsed,
  onToggleCollapse,
}: LeftPanelProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedId || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-id="${selectedId}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedId]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return buildings;
    return buildings.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.description?.toLowerCase().includes(q)
    );
  }, [buildings, searchQuery]);

  if (collapsed) {
    return (
      <div className="h-full flex flex-col items-center py-4 gap-4 bg-white border-r border-gray-200 w-12 shadow-sm">
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
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200 w-72 shrink-0 shadow-sm">

      {/* Hero — gold-to-dark gradient, no image tags */}
      <div className="relative shrink-0 h-28 bg-linear-to-br from-[#EEB310] via-amber-700 to-gray-900 flex flex-col justify-end px-4 pb-4">
        <button
          type="button"
          onClick={onToggleCollapse}
          title="Collapse panel"
          className="absolute top-3 right-3 p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-base font-black text-white leading-tight tracking-tight">UAPB Campus</h1>
        <p className="text-white/70 text-[10px] font-semibold uppercase tracking-widest mt-0.5">
          Research Map
        </p>
      </div>

      {/* Search */}
      <div className="shrink-0 px-4 py-3 border-b border-gray-100">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400"
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
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Stats strip */}
      <div className="shrink-0 flex border-b border-gray-100 bg-gray-50">
        <div className="flex-1 py-2 text-center">
          <p className="text-sm font-bold text-[#EEB310]">{buildings.length}</p>
          <p className="text-[9px] uppercase tracking-wider text-gray-400">Buildings</p>
        </div>
        <div className="flex-1 py-2 text-center border-l border-gray-100">
          <p className="text-sm font-bold text-[#EEB310]">{filtered.length}</p>
          <p className="text-[9px] uppercase tracking-wider text-gray-400">
            {searchQuery ? "Matches" : "On Map"}
          </p>
        </div>
      </div>

      {/* Building list */}
      <div ref={listRef} className="flex-1 overflow-y-auto">
        {buildings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 px-4 text-center">
            <div className="h-6 w-24 bg-gray-100 rounded animate-pulse mb-1" />
            <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2.5 px-4 text-center">
            <svg className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
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

      {/* Footer */}
      <div className="shrink-0 px-4 py-2.5 border-t border-gray-100 bg-gray-50">
        <p className="text-[9px] text-gray-400 text-center">
          University of Arkansas at Pine Bluff · Research Office
        </p>
      </div>
    </div>
  );
}
