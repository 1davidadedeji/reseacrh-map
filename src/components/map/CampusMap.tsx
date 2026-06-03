"use client";

import { useRef, useCallback, useEffect } from "react";
import Map, {
  NavigationControl,
  Marker,
  type MapRef,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { CampusBuilding } from "@/lib/campus-data";
import { getCampusBounds } from "@/lib/geo";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

interface CampusMapProps {
  buildings: CampusBuilding[];
  selectedId: string | null;
  onSelectBuilding: (id: string) => void;
}

export default function CampusMap({
  buildings,
  selectedId,
  onSelectBuilding,
}: CampusMapProps) {
  const mapRef = useRef<MapRef>(null);
  const hasFitBounds = useRef(false);

  const fitCampusBounds = useCallback(() => {
    if (!mapRef.current || buildings.length === 0) return;
    const { west, south, east, north } = getCampusBounds(buildings);
    mapRef.current.fitBounds(
      [
        [west, south],
        [east, north],
      ],
      { padding: 120, duration: 800, pitch: 45 }
    );
  }, [buildings]);

  useEffect(() => {
    if (!mapRef.current || hasFitBounds.current) return;
    const map = mapRef.current.getMap();
    if (map.isStyleLoaded()) {
      fitCampusBounds();
      hasFitBounds.current = true;
    } else {
      map.once("load", () => {
        fitCampusBounds();
        hasFitBounds.current = true;
      });
    }
  }, [fitCampusBounds]);

  useEffect(() => {
    if (!selectedId || !mapRef.current) return;
    const building = buildings.find((b) => b.id === selectedId);
    if (!building) return;

    mapRef.current.flyTo({
      center: [building.longitude, building.latitude],
      zoom: 17,
      pitch: 50,
      duration: 1200,
    });
  }, [selectedId, buildings]);

  useEffect(() => {
    if (selectedId && !buildings.find((b) => b.id === selectedId)) {
      fitCampusBounds();
    }
  }, [buildings, selectedId, fitCampusBounds]);

  return (
    <div className="w-full h-full">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: -92.0163,
          latitude: 34.2366,
          zoom: 15,
          pitch: 45,
          bearing: 0,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        antialias
      >
        {buildings.map((building) => {
          const isSelected = building.id === selectedId;
          return (
            <Marker
              key={building.id}
              longitude={building.longitude}
              latitude={building.latitude}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                onSelectBuilding(building.id);
              }}
            >
              <button
                type="button"
                className="group flex flex-col items-center cursor-pointer"
                aria-label={building.name}
              >
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide shadow-sm mb-1 transition-all ${
                    isSelected
                      ? "bg-[#EEB310] text-gray-900 scale-105"
                      : "bg-white text-gray-700 group-hover:bg-[#EEB310] group-hover:text-gray-900"
                  }`}
                >
                  {building.code}
                </span>
                <span
                  className={`h-3 w-3 rotate-45 transition-all ${
                    isSelected
                      ? "bg-[#EEB310] scale-125"
                      : "bg-white border border-gray-200 group-hover:bg-[#EEB310]"
                  }`}
                />
              </button>
            </Marker>
          );
        })}

        <NavigationControl position="bottom-right" visualizePitch />
      </Map>
    </div>
  );
}
