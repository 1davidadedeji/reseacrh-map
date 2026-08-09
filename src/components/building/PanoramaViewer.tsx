"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface PanoramaViewerProps {
  src: string;
  alt: string;
  className?: string;
}

/** Interactive drag-to-pan / wheel-to-zoom viewer for building photos (Baylor photosphere-style explore). */
export default function PanoramaViewer({ src, alt, className = "" }: PanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1.15);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    setScale(1.15);
    setOffset({ x: 0, y: 0 });
  }, [src]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [offset.x, offset.y]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setOffset({
      x: dragRef.current.ox + (e.clientX - dragRef.current.x),
      y: dragRef.current.oy + (e.clientY - dragRef.current.y),
    });
  }, []);

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => Math.min(3, Math.max(1, s - e.deltaY * 0.002)));
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-gray-900 cursor-grab active:cursor-grabbing select-none ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onWheel={onWheel}
      role="application"
      aria-label={`Interactive panorama view of ${alt}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover pointer-events-none will-change-transform"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: "center center",
        }}
      />
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
        <span className="text-[10px] text-white/70 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
          Drag to look around · Scroll to zoom
        </span>
      </div>
    </div>
  );
}
