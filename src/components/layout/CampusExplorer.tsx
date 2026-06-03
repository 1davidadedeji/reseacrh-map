"use client";

import { useMemo, useState } from "react";
import CampusMapLoader from "@/components/map/CampusMapLoader";
import TopNav from "@/components/layout/TopNav";
import BuildingSidebar from "@/components/sidebar/BuildingSidebar";
import {
  CAMPUS_BUILDINGS,
  type NavItem,
} from "@/lib/campus-data";
import { getCampusCenter } from "@/lib/geo";

export default function CampusExplorer() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeNav, setActiveNav] = useState<NavItem | null>(null);

  const campusCenter = useMemo(
    () => getCampusCenter(CAMPUS_BUILDINGS),
    []
  );

  const filteredBuildings = useMemo(() => {
    let results = CAMPUS_BUILDINGS;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.code.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q)
      );
    }

    if (activeNav === "Grants") {
      results = results.filter((b) => b.grants.length > 0);
    } else if (activeNav === "Research") {
      results = results.filter((b) => b.category === "Research");
    } else if (activeNav === "Departments") {
      results = results.filter((b) => b.researchers.length > 0);
    }

    return results;
  }, [searchQuery, activeNav]);

  const selectedBuilding =
    CAMPUS_BUILDINGS.find((b) => b.id === selectedId) ?? null;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-50">
      {/* Full-bleed map */}
      <div className="absolute inset-0">
        <CampusMapLoader
          buildings={filteredBuildings}
          selectedId={selectedId}
          onSelectBuilding={setSelectedId}
        />
      </div>

      {/* Overlay UI */}
      <div className="relative z-10 flex flex-col h-full pointer-events-none">
        <div className="pointer-events-auto">
          <TopNav
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeNav={activeNav}
            onNavChange={setActiveNav}
          />
        </div>

        <div className="flex-1 p-4 pointer-events-none">
          <div className="pointer-events-auto">
            <BuildingSidebar
              building={selectedBuilding}
              campusCenter={campusCenter}
              onClose={() => setSelectedId(null)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
