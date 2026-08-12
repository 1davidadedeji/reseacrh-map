"use client";

import {
  displayBuildingName,
  resolveCategory,
  shortDescriptionFor,
} from "@/lib/building-catalog";
import { IconDirections } from "@/components/building/MediaIcons";
import type { Building } from "@/types";
import type { GeoJsonBuildingMeta } from "@/types/building-selection";

interface PlaceDetailPanelProps {
  buildingId: string;
  building?: Building | null;
  meta?: GeoJsonBuildingMeta | null;
  onBack: () => void;
  onGetDirections: (buildingId: string) => void;
}

export default function PlaceDetailPanel({
  buildingId,
  building,
  meta,
  onBack,
  onGetDirections,
}: PlaceDetailPanelProps) {
  const rawName = building?.name ?? meta?.name ?? buildingId;
  const name = displayBuildingName(buildingId, rawName);
  const category = resolveCategory(buildingId);
  const description = shortDescriptionFor(buildingId, building?.description);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    building ? `${building.lat},${building.lng}` : `${name} University of Arkansas at Pine Bluff`,
  )}`;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 bg-white">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Back to building list"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-[11px] font-semibold text-gray-700 truncate flex-1">{name}</span>
        <button
          type="button"
          onClick={() => onGetDirections(buildingId)}
          className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EEB310] text-[10px] font-bold text-gray-900 hover:bg-amber-500 transition-colors"
        >
          <IconDirections className="h-3 w-3" onGold />
          Directions
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-4">
        <div>
          <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
            {category}
          </span>
          <h2 className="mt-2 text-base font-bold text-gray-900 leading-tight">{name}</h2>
          <p className="mt-2 text-xs text-gray-500 leading-relaxed">{description}</p>
        </div>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2560a6] hover:underline"
        >
          View on Google Maps
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}
