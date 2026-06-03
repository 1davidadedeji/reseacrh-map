"use client";

import dynamic from "next/dynamic";
import type { CampusBuilding } from "@/lib/campus-data";

const CampusMap = dynamic(() => import("@/components/map/CampusMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <span className="text-gray-400 text-sm">Loading map…</span>
    </div>
  ),
});

interface CampusMapLoaderProps {
  buildings: CampusBuilding[];
  selectedId: string | null;
  onSelectBuilding: (id: string) => void;
}

export default function CampusMapLoader(props: CampusMapLoaderProps) {
  return <CampusMap {...props} />;
}
