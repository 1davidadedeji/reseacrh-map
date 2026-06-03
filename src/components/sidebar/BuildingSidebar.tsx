"use client";

import type { ReactNode } from "react";
import type { CampusBuilding } from "@/lib/campus-data";
import { formatDistanceKm, getDistanceKm } from "@/lib/geo";

interface BuildingSidebarProps {
  building: CampusBuilding | null;
  campusCenter: { longitude: number; latitude: number };
  onClose: () => void;
}

function ActionButton({
  label,
  icon,
}: {
  label: string;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      className="flex flex-col items-center gap-1.5 group"
    >
      <span className="h-10 w-10 rounded-full bg-[#EEB310] flex items-center justify-center text-gray-900 shadow-sm group-hover:bg-[#d9a00e] transition-colors">
        {icon}
      </span>
      <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </span>
    </button>
  );
}

export default function BuildingSidebar({
  building,
  campusCenter,
  onClose,
}: BuildingSidebarProps) {
  const distanceLabel = building
    ? formatDistanceKm(
        getDistanceKm(campusCenter, {
          longitude: building.longitude,
          latitude: building.latitude,
        })
      )
    : null;

  return (
    <aside className="w-[min(100%,22rem)] max-h-[calc(100vh-5.5rem)] flex flex-col bg-white rounded-2xl shadow-xl shadow-gray-200/60 overflow-hidden border border-gray-100">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          aria-label="Close panel"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-300">
          Campus Map
        </span>
        <div className="w-7" />
      </div>

      {!building ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700">Select a building</p>
          <p className="mt-1 text-xs text-gray-400 leading-relaxed">
            Click a marker on the map to view research details, grants, and faculty.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Hero image placeholder */}
          <div className="relative h-36 bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-1">
                <div className="h-8 w-8 rounded-full bg-[#EEB310] flex items-center justify-center shadow-md">
                  <svg className="h-4 w-4 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
                  </svg>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  UAPB Campus
                </span>
              </div>
            </div>
          </div>

          {/* Title block */}
          <div className="px-5 pt-4 pb-3">
            <h2 className="text-lg font-bold text-gray-900 leading-tight">
              {building.name}
            </h2>
            <div className="mt-1.5 flex items-center gap-2">
              {distanceLabel && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <svg className="h-3 w-3 text-[#EEB310]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  {distanceLabel} from center
                </span>
              )}
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#EEB310]">
                {building.category}
              </span>
            </div>
            {building.description && (
              <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                {building.description}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="px-5 pb-4 flex items-center justify-between">
            <ActionButton
              label="Directions"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              }
            />
            <ActionButton
              label="Save"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              }
            />
            <ActionButton
              label="Nearby"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />
            <ActionButton
              label="Share"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              }
            />
          </div>

          {/* Grants section */}
          {building.grants.length > 0 && (
            <section className="px-5 py-4 border-t border-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <span className="h-6 w-6 rounded-lg bg-[#EEB310]/15 flex items-center justify-center">
                  <svg className="h-3.5 w-3.5 text-[#EEB310]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Active Grants
                </h3>
              </div>
              <ul className="space-y-2">
                {building.grants.map((grant) => (
                  <li
                    key={grant.id}
                    className="flex items-start justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 leading-snug">
                        {grant.title}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{grant.amount}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        grant.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {grant.status}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Researchers section */}
          {building.researchers.length > 0 && (
            <section className="px-5 py-4 border-t border-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <span className="h-6 w-6 rounded-lg bg-[#EEB310]/15 flex items-center justify-center">
                  <svg className="h-3.5 w-3.5 text-[#EEB310]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </span>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Key Researchers
                </h3>
              </div>
              <ul className="space-y-2">
                {building.researchers.map((researcher) => (
                  <li
                    key={researcher.name}
                    className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5"
                  >
                    <div className="h-8 w-8 shrink-0 rounded-full bg-[#EEB310]/20 flex items-center justify-center text-[#EEB310] font-bold text-xs">
                      {researcher.name.charAt(4)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">
                        {researcher.name}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {researcher.dept} · {researcher.specialty}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Building meta */}
          <section className="px-5 py-4 border-t border-gray-50">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-50 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Code</p>
                <p className="text-sm font-semibold text-gray-800">{building.code}</p>
              </div>
              <div className="rounded-xl bg-gray-50 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Floors</p>
                <p className="text-sm font-semibold text-gray-800">{building.floors}</p>
              </div>
            </div>
          </section>
        </div>
      )}
    </aside>
  );
}
