"use client";

import { useState, useEffect } from "react";
import type { Building, ResearchProject, Researcher } from "@/types";

function formatDollars(amount: number | null): string {
  if (amount === null) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

const STATUS_STYLES: Record<ResearchProject["status"], { label: string; className: string }> = {
  active: { label: "Active", className: "bg-green-100 text-green-700" },
  completed: { label: "Completed", className: "bg-gray-100 text-gray-500" },
  pending: { label: "Proposed", className: "bg-blue-100 text-blue-700" },
  on_hold: { label: "On Hold", className: "bg-amber-100 text-amber-700" },
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded ${className}`} />;
}

interface BuildingSidebarProps {
  buildingId: string;
  displayName: string;
  displayCode?: string;
  building: Building | null;
  onClose: () => void;
}

export default function BuildingSidebar({
  buildingId,
  displayName,
  displayCode,
  building,
  onClose,
}: BuildingSidebarProps) {
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setFetchError(null);
      setProjects([]);
      setResearchers([]);

      try {
        const url = `/api/buildings/${encodeURIComponent(buildingId)}/research`;
        const res = await fetch(url);
        if (cancelled) return;

        if (!res.ok) {
          console.error("[research]", `HTTP ${res.status}`, { url, buildingId });
          setFetchError("Could not load research data. Please try again.");
          setLoading(false);
          return;
        }

        const body = (await res.json()) as {
          projects: ResearchProject[];
          researchers: Researcher[];
          source?: string;
        };

        if (!Array.isArray(body.projects) || !Array.isArray(body.researchers)) {
          console.error("[research] unexpected shape", body, { url, buildingId });
          setFetchError("Unexpected response from server.");
          setLoading(false);
          return;
        }

        setProjects(body.projects);
        setResearchers(body.researchers);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error("[research]", err instanceof Error ? err.message : err, { buildingId });
        setFetchError("Could not load research data. Please try again.");
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [buildingId]);

  const name = building?.name ?? displayName;
  const code = building?.code ?? displayCode ?? "—";
  const isEmpty = !loading && !fetchError && projects.length === 0 && researchers.length === 0;

  return (
    <aside className="h-full flex flex-col bg-white overflow-hidden">
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Close panel"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-300">
          Building Details
        </span>
        <div className="w-7" />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="relative h-36 bg-linear-to-br from-amber-50 via-gray-100 to-gray-200 shrink-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-1.5">
            <div className="h-12 w-12 rounded-2xl bg-[#EEB310] flex items-center justify-center shadow-lg">
              <span className="text-sm font-black text-gray-900">{code}</span>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              UAPB Campus
            </span>
          </div>
        </div>

        <div className="px-5 pt-4 pb-3">
          <h2 className="text-lg font-bold text-gray-900 leading-tight">{name}</h2>
          {building && (
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {building.floors != null && (
                <span className="text-xs text-gray-400">
                  {building.floors} floor{building.floors !== 1 ? "s" : ""}
                </span>
              )}
              {building.year_built != null && (
                <span className="text-xs text-gray-400">· Built {building.year_built}</span>
              )}
            </div>
          )}
          {building?.description && (
            <p className="mt-3 text-xs text-gray-500 leading-relaxed">{building.description}</p>
          )}
        </div>

        <section className="px-5 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-6 w-6 rounded-lg bg-[#EEB310]/15 flex items-center justify-center">
              <svg className="h-3.5 w-3.5 text-[#EEB310]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-700">
              Research Projects
            </h3>
          </div>

          {loading && (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          )}

          {fetchError && (
            <p className="text-xs text-red-500">{fetchError}</p>
          )}

          {!loading && !fetchError && projects.length > 0 && (
            <ul className="space-y-2">
              {projects.map((p) => {
                const badge = STATUS_STYLES[p.status];
                return (
                  <li key={p.id} className="rounded-xl bg-gray-50 px-3 py-2.5 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium text-gray-800 leading-snug">{p.title}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                    {(p.funding_source || p.grant_amount != null) && (
                      <p className="text-[11px] text-gray-400">
                        {p.funding_source}
                        {p.funding_source && p.grant_amount != null ? " · " : ""}
                        {p.grant_amount != null && (
                          <span className="text-gray-600 font-semibold">
                            {formatDollars(p.grant_amount)}
                          </span>
                        )}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {isEmpty && (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center mb-3">
                <svg className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500">No research data yet for this building</p>
            </div>
          )}
        </section>

        <section className="px-5 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-6 w-6 rounded-lg bg-[#EEB310]/15 flex items-center justify-center">
              <svg className="h-3.5 w-3.5 text-[#EEB310]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </span>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-700">Researchers</h3>
          </div>

          {loading && (
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-36 rounded-full" />
              <Skeleton className="h-8 w-40 rounded-full" />
            </div>
          )}

          {!loading && !fetchError && researchers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {researchers.map((r) => (
                <div
                  key={r.id}
                  className="inline-flex items-center gap-2 rounded-full bg-gray-50 border border-gray-200 px-3 py-1.5"
                >
                  <div className="h-6 w-6 shrink-0 rounded-full bg-[#EEB310]/20 flex items-center justify-center text-[#EEB310] font-bold text-[9px]">
                    {r.avatar_url ? (
                      <img src={r.avatar_url} alt={r.name} className="h-6 w-6 rounded-full object-cover" />
                    ) : (
                      initials(r.name)
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-gray-800 truncate">{r.name}</p>
                    {r.title && (
                      <p className="text-[10px] text-gray-400 truncate">{r.title}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !fetchError && researchers.length === 0 && !isEmpty && (
            <p className="text-xs text-gray-400">No researchers listed for this building.</p>
          )}
        </section>

        {building && (
          <>
            <section className="px-5 py-4 border-t border-gray-100">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-gray-50 px-3 py-2.5">
                  <p className="text-[9px] uppercase tracking-wider text-gray-400">Code</p>
                  <p className="text-sm font-semibold text-gray-800">{building.code}</p>
                </div>
                <div className="rounded-xl bg-gray-50 px-3 py-2.5">
                  <p className="text-[9px] uppercase tracking-wider text-gray-400">Floors</p>
                  <p className="text-sm font-semibold text-gray-800">{building.floors ?? "—"}</p>
                </div>
                <div className="rounded-xl bg-gray-50 px-3 py-2.5">
                  <p className="text-[9px] uppercase tracking-wider text-gray-400">Built</p>
                  <p className="text-sm font-semibold text-gray-800">{building.year_built ?? "—"}</p>
                </div>
              </div>
            </section>

            <div className="px-5 pb-6">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${building.lat},${building.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-200 text-xs text-gray-500 hover:border-[#EEB310]/60 hover:text-amber-700 hover:bg-amber-50 transition-all"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View on Google Maps
              </a>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
