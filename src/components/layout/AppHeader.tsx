"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";

interface AppHeaderProps {
  active: "map" | "directory";
  rightSlot?: ReactNode;
  onHomeClick?: () => void;
}

function handleMapHomeNav(
  e: MouseEvent<HTMLAnchorElement>,
  active: "map" | "directory",
  onHomeClick?: () => void
) {
  if (active === "map" && onHomeClick) {
    e.preventDefault();
    onHomeClick();
  }
}

export default function AppHeader({ active, rightSlot, onHomeClick }: AppHeaderProps) {
  return (
    <header className="shrink-0 h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-4 z-20 shadow-sm">
      <Link
        href="/"
        onClick={(e) => handleMapHomeNav(e, active, onHomeClick)}
        className="flex items-center gap-2.5 shrink-0 hover:opacity-90 transition-opacity"
        aria-label="UAPB Research Map home"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/uapb-logo.png"
          alt="University of Arkansas at Pine Bluff"
          className="h-9 w-auto object-contain"
        />
        <div className="hidden sm:block leading-tight">
          <p className="text-[11px] font-bold text-gray-900 leading-none">UAPB</p>
          <p className="text-[8px] text-[#EEB310] uppercase tracking-widest leading-none font-semibold">
            Research Map
          </p>
        </div>
      </Link>

      <div className="h-5 w-px bg-gray-200 shrink-0" />

      <nav className="flex items-center gap-1">
        <Link
          href="/"
          onClick={(e) => handleMapHomeNav(e, active, onHomeClick)}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
            active === "map"
              ? "bg-amber-50 text-amber-700"
              : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
          }`}
        >
          Campus Map
        </Link>
        <Link
          href="/directory"
          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
            active === "directory"
              ? "bg-amber-50 text-amber-700"
              : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
          }`}
        >
          People Directory
        </Link>
      </nav>

      <div className="flex-1" />

      {rightSlot}

      <a
        href="https://www.uapb.edu"
        target="_blank"
        rel="noopener noreferrer"
        className="hidden lg:flex items-center gap-1.5 text-[10px] text-gray-400 hover:text-[#EEB310] transition-colors shrink-0"
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        uapb.edu
      </a>
    </header>
  );
}
