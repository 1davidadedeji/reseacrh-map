"use client";

import { NAV_ITEMS, type NavItem } from "@/lib/campus-data";

interface TopNavProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeNav: NavItem | null;
  onNavChange: (item: NavItem | null) => void;
}

export default function TopNav({
  searchQuery,
  onSearchChange,
  activeNav,
  onNavChange,
}: TopNavProps) {
  return (
    <header className="shrink-0 flex items-center gap-6 px-5 h-14 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      {/* Logo */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="h-8 w-8 rounded-lg border-2 border-[#EEB310] flex items-center justify-center">
          <span className="text-[#EEB310] font-bold text-xs">U</span>
        </div>
        <span className="text-sm font-semibold tracking-wide text-gray-900 hidden sm:block">
          UAPB Research
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 flex items-center justify-center gap-1 overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activeNav === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => onNavChange(isActive ? null : item)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium uppercase tracking-wider whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-[#EEB310] text-gray-900"
                  : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {item}
            </button>
          );
        })}
      </nav>

      {/* Search */}
      <div className="relative shrink-0 w-44 sm:w-56">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
          />
        </svg>
        <input
          type="search"
          placeholder="Search campus…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-9 pl-9 pr-3 rounded-full bg-gray-100 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#EEB310]/40 transition-shadow"
        />
      </div>
    </header>
  );
}
