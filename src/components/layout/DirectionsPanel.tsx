"use client";

import { useEffect, useRef, useState } from "react";
import type { Building } from "@/types";
import {
  getRoute,
  formatDistance,
  formatDuration,
  DirectionsError,
  type DirectionsResult,
  type TravelProfile,
} from "@/lib/directions";
import type { UserLocation } from "@/components/map/CampusMap";

export const MY_LOCATION = "__my_location__";

interface DirectionsPanelProps {
  buildings: Building[];
  selectedId: string | null;
  route: DirectionsResult | null;
  onRouteChange: (route: DirectionsResult | null) => void;
  userLocation: UserLocation | null;
  onUserLocationChange: (loc: UserLocation | null) => void;
  onStepFocus: (location: [number, number]) => void;
  fromId: string;
  toId: string;
  onFromIdChange: (id: string) => void;
  onToIdChange: (id: string) => void;
}

function buildingCoord(b: Building): [number, number] {
  return [b.lng, b.lat];
}

const MAPBOX_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);

export default function DirectionsPanel({
  buildings,
  selectedId,
  route,
  onRouteChange,
  userLocation,
  onUserLocationChange,
  onStepFocus,
  fromId,
  toId,
  onFromIdChange,
  onToIdChange,
}: DirectionsPanelProps) {
  const [profile, setProfile] = useState<TravelProfile>("walking");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const lastAppliedSelection = useRef<string | null>(null);

  // Pin click fills empty slot — destination first, then origin.
  useEffect(() => {
    if (!selectedId || selectedId === lastAppliedSelection.current) return;
    lastAppliedSelection.current = selectedId;
    if (!toId) {
      onToIdChange(selectedId);
    } else if (!fromId) {
      onFromIdChange(selectedId);
    }
  }, [selectedId, fromId, toId, onFromIdChange, onToIdChange]);

  // Clear stale route when both endpoints are cleared.
  useEffect(() => {
    if (!fromId && !toId && route) {
      onRouteChange(null);
    }
  }, [fromId, toId, route, onRouteChange]);

  const useMyLocation = () => {
    setError(null);
    setLocating(true);
    if (!navigator.geolocation) {
      setError("Geolocation isn't supported on this device.");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onUserLocationChange({ lng: pos.coords.longitude, lat: pos.coords.latitude });
        onFromIdChange(MY_LOCATION);
        setLocating(false);
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location access was denied — enable it in your browser to route from here."
            : "Couldn't determine your location."
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const swapEndpoints = () => {
    if (fromId === MY_LOCATION) {
      setError("Can't swap when starting from your current location.");
      return;
    }
    const prevFrom = fromId;
    onFromIdChange(toId);
    onToIdChange(prevFrom);
    onRouteChange(null);
    setError(null);
  };

  const handleGetDirections = async () => {
    if (!MAPBOX_CONFIGURED) {
      setError("Directions need a Mapbox token (NEXT_PUBLIC_MAPBOX_TOKEN).");
      return;
    }

    const fromCoord =
      fromId === MY_LOCATION
        ? userLocation
          ? ([userLocation.lng, userLocation.lat] as [number, number])
          : null
        : buildings.find((b) => b.id === fromId)
          ? buildingCoord(buildings.find((b) => b.id === fromId)!)
          : null;
    const toBuilding = buildings.find((b) => b.id === toId);

    if (!fromCoord || !toBuilding) {
      setError("Choose both a starting point and a destination.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getRoute(fromCoord, buildingCoord(toBuilding), profile);
      onRouteChange(result);
    } catch (err) {
      onRouteChange(null);
      setError(err instanceof DirectionsError ? err.message : "Couldn't get directions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const clearRoute = () => {
    onRouteChange(null);
    onFromIdChange("");
    onToIdChange("");
    setError(null);
    lastAppliedSelection.current = null;
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {!MAPBOX_CONFIGURED && (
        <div className="shrink-0 mx-4 mt-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
          Directions are unavailable — set <code className="font-mono">NEXT_PUBLIC_MAPBOX_TOKEN</code> in your environment.
        </div>
      )}

      <div className="shrink-0 px-4 py-3 border-b border-gray-100 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Route</span>
          <button
            type="button"
            onClick={swapEndpoints}
            disabled={!fromId || !toId || fromId === MY_LOCATION}
            title="Swap start and destination"
            className="p-1 rounded text-gray-400 hover:text-[#EEB310] disabled:opacity-30 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">From</span>
          <div className="mt-1 flex gap-1.5">
            <select
              value={fromId}
              onChange={(e) => {
                onFromIdChange(e.target.value);
                onRouteChange(null);
              }}
              className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-[12px] text-gray-800 outline-none focus:border-[#EEB310] focus:bg-white transition-all"
            >
              <option value="">Select a building…</option>
              {userLocation && <option value={MY_LOCATION}>My current location</option>}
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              title="Use my current location"
              className="shrink-0 px-2 rounded-lg border border-gray-200 text-gray-400 hover:text-[#EEB310] hover:border-amber-300 transition-colors disabled:opacity-50"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8a4 4 0 100 8 4 4 0 000-8z" />
                <path strokeLinecap="round" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
              </svg>
            </button>
          </div>
        </label>

        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">To</span>
          <select
            value={toId}
            onChange={(e) => {
              onToIdChange(e.target.value);
              onRouteChange(null);
            }}
            className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-[12px] text-gray-800 outline-none focus:border-[#EEB310] focus:bg-white transition-all"
          >
            <option value="">Select a building…</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1 rounded-lg bg-gray-50 border border-gray-200 p-0.5">
          {(["walking", "driving"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setProfile(p)}
              className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold capitalize transition-colors ${
                profile === p ? "bg-white text-amber-700 shadow-sm" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {p === "walking" ? "Walk" : "Drive"}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void handleGetDirections()}
          disabled={loading || !fromId || !toId || !MAPBOX_CONFIGURED}
          className="w-full py-2 rounded-lg bg-[#EEB310] text-gray-900 text-[12px] font-bold hover:bg-amber-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Getting directions…" : "Get Directions"}
        </button>

        {error && <p className="text-[11px] text-red-500">{error}</p>}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {route ? (
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {formatDistance(route.distanceMeters)} · {formatDuration(route.durationSeconds)}
                </p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                  {route.profile === "walking" ? "Walking" : "Driving"} directions
                </p>
              </div>
              <button
                type="button"
                onClick={clearRoute}
                className="text-[11px] font-semibold text-gray-400 hover:text-gray-700 transition-colors"
              >
                Clear
              </button>
            </div>

            <ol className="space-y-1">
              {route.steps.map((step, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => onStepFocus(step.location)}
                    className="w-full text-left flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-amber-50 transition-colors"
                  >
                    <span className="mt-0.5 shrink-0 h-5 w-5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <p className="text-[12px] text-gray-800 leading-snug">{step.instruction}</p>
                      {step.distanceMeters > 0 && (
                        <p className="text-[10px] text-gray-400 mt-0.5">{formatDistance(step.distanceMeters)}</p>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 gap-2.5 px-4 text-center">
            <svg className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <p className="text-[12px] text-gray-400">
              Pick a start and destination, or click buildings on the map to fill the route.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
