"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import AppHeader from "@/components/layout/AppHeader";
import LeftPanel, { type SidebarTab } from "@/components/layout/LeftPanel";
import ProfileModal from "@/components/directory/ProfileModal";
import AIAssistant from "@/components/ai/AIAssistant";
import type { Building } from "@/types";
import type { GeoJsonBuildingMeta } from "@/types/building-selection";
import type { DirectionsResult } from "@/lib/directions";
import type { DirectoryResearcher } from "@/lib/research-seed";
import type { UserLocation } from "@/components/map/CampusMap";

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
  const [researchers, setResearchers] = useState<DirectoryResearcher[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedMeta, setSelectedMeta] = useState<GeoJsonBuildingMeta | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("locations");
  const [route, setRoute] = useState<DirectionsResult | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [focusPoint, setFocusPoint] = useState<[number, number] | null>(null);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [openResearcherId, setOpenResearcherId] = useState<string | null>(null);
  const [viewResetNonce, setViewResetNonce] = useState(0);
  const [showAllCampusBuildings, setShowAllCampusBuildings] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/buildings");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { buildings: data } = (await res.json()) as { buildings: Building[] };
        setBuildings(data);
      } catch (err) {
        console.error("[buildings]", err instanceof Error ? err.message : err);
      }
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/researchers");
        if (!res.ok) return;
        const { researchers: data } = (await res.json()) as { researchers: DirectoryResearcher[] };
        setResearchers(data);
      } catch {
        /* directory optional on map page */
      }
    })();
  }, []);

  useEffect(() => {
    if (window.location.pathname !== "/") return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("building");
    if (id) {
      setSelectedId(id);
      setSidebarTab("locations");
    }
  }, []);

  useEffect(() => {
    if (window.location.pathname !== "/") return;
    const url = new URL(window.location.href);
    if (selectedId) url.searchParams.set("building", selectedId);
    else url.searchParams.delete("building");
    window.history.replaceState(null, "", url.toString());
  }, [selectedId]);

  const selectedBuilding = buildings.find((b) => b.id === selectedId) ?? null;
  const openResearcher = researchers.find((r) => r.id === openResearcherId) ?? null;

  const handleSelectBuilding = useCallback(
    (id: string, meta?: GeoJsonBuildingMeta) => {
      setSelectedId(id);
      setSelectedMeta(meta ?? null);
      if (sidebarTab === "directions") {
        if (!fromId) setFromId(id);
        else if (!toId && id !== fromId) setToId(id);
      } else {
        setSidebarTab("locations");
      }
      if (panelCollapsed) setPanelCollapsed(false);
    },
    [panelCollapsed, sidebarTab, fromId, toId]
  );

  const handleClose = useCallback(() => {
    setSelectedId(null);
    setSelectedMeta(null);
  }, []);

  const handleGetDirections = useCallback((buildingId: string) => {
    setToId(buildingId);
    setSidebarTab("directions");
    if (panelCollapsed) setPanelCollapsed(false);
  }, [panelCollapsed]);

  const handleResearcherClick = useCallback((researcherId: string) => {
    setOpenResearcherId(researcherId);
  }, []);

  const resetToHome = useCallback(() => {
    setSelectedId(null);
    setSelectedMeta(null);
    setSearchQuery("");
    setRoute(null);
    setFromId("");
    setToId("");
    setSidebarTab("locations");
    setOpenResearcherId(null);
    setFocusPoint(null);
    setPanelCollapsed(false);
    setViewResetNonce((n) => n + 1);
    window.history.replaceState(null, "", "/");
  }, []);

  const displayName =
    selectedBuilding?.name ?? selectedMeta?.name ?? selectedId ?? "Building";

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50">
      <AppHeader
        active="map"
        onHomeClick={resetToHome}
        rightSlot={
          <div
            className={`hidden md:flex items-center gap-2 text-[11px] transition-opacity duration-200 motion-reduce:transition-none ${
              selectedId ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-hidden={!selectedId}
          >
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
        }
      />

      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <LeftPanel
          buildings={buildings}
          selectedId={selectedId}
          selectedMeta={selectedMeta}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectBuilding={(id) => {
            const b = buildings.find((x) => x.id === id);
            handleSelectBuilding(
              id,
              b ? { id: b.id, name: b.name, code: b.code } : undefined
            );
          }}
          onClearSelection={handleClose}
          collapsed={panelCollapsed}
          onToggleCollapse={() => setPanelCollapsed((c) => !c)}
          route={route}
          onRouteChange={setRoute}
          userLocation={userLocation}
          onUserLocationChange={setUserLocation}
          onStepFocus={(loc) => setFocusPoint([...loc])}
          tab={sidebarTab}
          onTabChange={setSidebarTab}
          fromId={fromId}
          toId={toId}
          onFromIdChange={setFromId}
          onToIdChange={setToId}
          onGetDirections={handleGetDirections}
          onResearcherClick={handleResearcherClick}
          showAllCampusBuildings={showAllCampusBuildings}
          onShowAllCampusBuildingsChange={setShowAllCampusBuildings}
        />

        <main className="relative flex-1 min-w-0 min-h-0 overflow-hidden bg-gray-100">
          <CampusMap
            buildings={buildings}
            selectedId={selectedId}
            onSelectBuilding={handleSelectBuilding}
            leftPanelCollapsed={panelCollapsed}
            rightSidebarOpen={false}
            route={route}
            userLocation={userLocation}
            onUserLocationChange={setUserLocation}
            focusPoint={focusPoint}
            viewResetNonce={viewResetNonce}
            onCampusHomeClick={resetToHome}
            showAllCampusBuildings={showAllCampusBuildings}
          />
        </main>
      </div>

      {openResearcher && (
        <ProfileModal
          researcher={openResearcher}
          onClose={() => setOpenResearcherId(null)}
        />
      )}

      <AIAssistant />
    </div>
  );
}
