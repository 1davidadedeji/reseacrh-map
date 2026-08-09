"use client";

interface BuildingMapEmbedProps {
  lat: number;
  lng: number;
  name: string;
  mode: "streetview" | "satellite";
  className?: string;
}

function streetViewEmbedUrl(lat: number, lng: number): string {
  return `https://maps.google.com/maps?layer=c&cbll=${lat},${lng}&cbp=1,0,0,0,0&output=svembed`;
}

function satelliteEmbedUrl(lat: number, lng: number): string {
  return `https://maps.google.com/maps?q=${lat},${lng}&t=k&z=19&hl=en&output=embed`;
}

export default function BuildingMapEmbed({
  lat,
  lng,
  name,
  mode,
  className = "",
}: BuildingMapEmbedProps) {
  const src = mode === "streetview" ? streetViewEmbedUrl(lat, lng) : satelliteEmbedUrl(lat, lng);
  const label = mode === "streetview" ? "Street View" : "Satellite";

  return (
    <div className={`relative bg-gray-900 ${className}`}>
      <iframe
        title={`${label} — ${name}`}
        src={src}
        className="absolute inset-0 h-full w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2 pointer-events-none">
        <span className="text-[10px] text-white/80 bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">
          Google Maps · {label}
        </span>
        <a
          href={`https://www.google.com/maps/@${lat},${lng},19z`}
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto text-[10px] text-white/90 bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm hover:bg-black/70"
        >
          Open in Maps ↗
        </a>
      </div>
    </div>
  );
}
