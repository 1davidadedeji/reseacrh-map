"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import LeftPanel from "@/components/layout/LeftPanel";
import BuildingSidebar from "@/components/sidebar/BuildingSidebar";
import AIAssistant from "@/components/ai/AIAssistant";
import type { Building } from "@/types";
import type { GeoJsonBuildingMeta } from "@/types/building-selection";

const CampusMap = dynamic(() => import("@/components/map/CampusMap"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
      <span className="text-sm text-gray-400">Loading map…</span>
    </div>
  ),
});

export default function CampusExplorer() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedMeta, setSelectedMeta] = useState<GeoJsonBuildingMeta | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/buildings");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { buildings: data } = (await res.json()) as { buildings: Building[] };
        setBuildings(data);
      } catch (err) {
        console.error(
          "[buildings]",
          err instanceof Error ? err.message : err
        );
      }
    })();
  }, []);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("building");
    if (id) setSelectedId(id);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedId) url.searchParams.set("building", selectedId);
    else url.searchParams.delete("building");
    window.history.replaceState(null, "", url.toString());
  }, [selectedId]);

  const selectedBuilding = buildings.find((b) => b.id === selectedId) ?? null;

  const handleSelectBuilding = useCallback(
    (id: string, meta?: GeoJsonBuildingMeta) => {
      setSelectedId((prev) => {
        if (prev === id) {
          setSelectedMeta(null);
          return null;
        }
        setSelectedMeta(meta ?? null);
        return id;
      });
    },
    []
  );

  const handleClose = useCallback(() => {
    setSelectedId(null);
    setSelectedMeta(null);
  }, []);

  const displayName =
    selectedBuilding?.name ?? selectedMeta?.name ?? selectedId ?? "Building";
  const displayCode = selectedBuilding?.code ?? selectedMeta?.code;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50">
      <header className="shrink-0 h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-4 z-20 shadow-sm">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="h-7 w-7 rounded-lg bg-[#EEB310] flex items-center justify-center shadow-sm">
            <span className="text-[9px] font-black text-gray-900">UA</span>
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="text-[11px] font-bold text-gray-900 leading-none">UAPB</p>
            <p className="text-[8px] text-[#EEB310] uppercase tracking-widest leading-none font-semibold">
              Research Map
            </p>
          </div>
        </div>

        <div className="h-5 w-px bg-gray-200 shrink-0" />
        <div className="flex-1" />

        {selectedId && (
          <div className="hidden md:flex items-center gap-2 text-[11px]">
            <span className="text-gray-400">Selected:</span>
            <span className="text-[#EEB310] font-semibold">{displayName}</span>
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-700 transition-colors"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <a
          href="https://www.uapb.edu"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden lg:flex items-center gap-1.5 text-[10px] text-gray-400 hover:text-[#EEB310] transition-colors shrink-0"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          uapb.edu
        </a>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <LeftPanel
          buildings={buildings}
          selectedId={selectedId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectBuilding={(id) => {
            const b = buildings.find((x) => x.id === id);
            handleSelectBuilding(
              id,
              b ? { id: b.id, name: b.name, code: b.code } : undefined
            );
          }}
          collapsed={panelCollapsed}
          onToggleCollapse={() => setPanelCollapsed((c) => !c)}
        />

        <main className="relative flex-1 min-w-0 min-h-0 overflow-hidden bg-gray-100">
          <CampusMap
            buildings={buildings}
            selectedId={selectedId}
            onSelectBuilding={handleSelectBuilding}
            leftPanelCollapsed={panelCollapsed}
            rightSidebarOpen={Boolean(selectedId)}
          />
        </main>

        <div
          className={`shrink-0 h-full overflow-hidden border-l border-gray-200 bg-white transition-all duration-300 shadow-xl ${
            selectedId ? "w-80 xl:w-96" : "w-0"
          }`}
        >
          {selectedId && (
            <BuildingSidebar
              buildingId={selectedId}
              displayName={displayName}
              displayCode={displayCode}
              building={selectedBuilding}
              onClose={handleClose}
            />
          )}
        </div>
      </div>

      <AIAssistant />
    </div>
  );
}
