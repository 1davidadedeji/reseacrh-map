"use client";

import { useEffect, useMemo, useState } from "react";
import AppHeader from "@/components/layout/AppHeader";
import ProfileCard from "@/components/directory/ProfileCard";
import ProfileModal from "@/components/directory/ProfileModal";
import type { DirectoryResearcher } from "@/lib/research-seed";

export default function PeopleDirectory() {
  const [researchers, setResearchers] = useState<DirectoryResearcher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const person = new URLSearchParams(window.location.search).get("person");
    if (person) setOpenId(person);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (openId) url.searchParams.set("person", openId);
    else url.searchParams.delete("person");
    window.history.replaceState(null, "", url.toString());
  }, [openId]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/researchers");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { researchers: data } = (await res.json()) as { researchers: DirectoryResearcher[] };
        setResearchers(data);
      } catch (err) {
        console.error("[researchers]", err instanceof Error ? err.message : err);
        setError("Could not load the directory. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const departments = useMemo(
    () => Array.from(new Set(researchers.map((r) => r.department).filter((d): d is string => Boolean(d)))).sort(),
    [researchers]
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return researchers.filter((r) => {
      if (department && r.department !== department) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.title?.toLowerCase().includes(q) ||
        r.department?.toLowerCase().includes(q) ||
        r.specializations.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [researchers, query, department]);

  const openResearcher = researchers.find((r) => r.id === openId) ?? null;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50">
      <AppHeader active="directory" />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="mb-6">
            <h1 className="text-xl font-black text-gray-900">People Directory</h1>
            <p className="text-sm text-gray-500 mt-1">
              Faculty and researchers across UAPB campus buildings — reach out directly or explore their work.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 mb-6">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, title, or specialization…"
                className="w-full bg-white border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-[13px] text-gray-800 placeholder-gray-400 outline-none focus:border-[#EEB310] transition-all"
              />
            </div>
            {departments.length > 0 && (
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-700 outline-none focus:border-[#EEB310] transition-all"
              >
                <option value="">All departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}
          </div>

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          {!loading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
              <p className="text-sm text-gray-400">No matching researchers found.</p>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((r) => (
                <ProfileCard key={r.id} researcher={r} onOpen={() => setOpenId(r.id)} />
              ))}
            </div>
          )}
        </div>
      </main>

      {openResearcher && (
        <ProfileModal researcher={openResearcher} onClose={() => setOpenId(null)} />
      )}
    </div>
  );
}
