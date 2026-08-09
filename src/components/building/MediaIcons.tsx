/** Diamond turn-arrow directions icon (UAPB gold). */
export function IconDirections({
  className,
  onGold = false,
}: {
  className?: string;
  /** Use when rendered on a gold button background for contrast. */
  onGold?: boolean;
}) {
  const diamond = onGold ? "#1a1a1a" : "#EEB310";
  const arrow = onGold ? "#EEB310" : "#ffffff";
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="5"
        y="5"
        width="14"
        height="14"
        rx="1.5"
        transform="rotate(45 12 12)"
        fill={diamond}
      />
      <path
        fill={arrow}
        d="M10.25 15.75V11c0-.55.45-1 1-1h1.75L10.5 8.5l.7-.7L14.75 12l-3.55 3.55-.7-.7 1.5-1.5H11.25c-.55 0-1-.45-1-1v3.75h-.25z"
      />
    </svg>
  );
}

export function IconFullscreenExpand({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 7h4V5H5v6h2V7zm10 0v2h2V5h-6v2h4zM7 17H5v6h6v-2H7v-4zm10 4h-4v2h6v-6h-2v4z" />
    </svg>
  );
}

export function IconFullscreenExit({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
    </svg>
  );
}

export function IconPanorama({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zm-1-11h2v6h-2V8zm0 8h2v2h-2v-2z" opacity="0" />
      <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zm-6-1.5l-3-3-3 3-3-3-3 3V19h18v-3.5l-3-3z" />
    </svg>
  );
}

export function IconPhoto({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
    </svg>
  );
}

export function IconSatellite({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7v-7zm4-3h2v10h-2V7zm4 6h2v4h-2v-4z" />
    </svg>
  );
}
