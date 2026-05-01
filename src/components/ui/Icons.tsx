// Clean, minimal SVG icons for the meditation app
// All icons are 24x24 viewBox, stroke-based, calm aesthetic

export function IconMood({ size = 24, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Person sitting in meditation */}
      <circle cx="12" cy="5.5" r="2" />
      <path d="M8 12c0-1 .8-2 2-2h4c1.2 0 2 1 2 2" />
      <path d="M6 16c1-2 2.5-3 4-3h4c1.5 0 3 1 4 3" />
      <path d="M9 10v6" opacity="0.4" />
      <path d="M15 10v6" opacity="0.4" />
    </svg>
  );
}

export function IconWave({ size = 24, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      {/* Calm wave / breath */}
      <path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0" />
      <path d="M3 17c2-3 4-3 6 0s4 3 6 0 4-3 6 0" opacity="0.35" />
    </svg>
  );
}

export function IconGrid({ size = 24, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* 2x2 theme grid */}
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </svg>
  );
}

export function IconPen({ size = 24, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

export function IconPlay({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
      <path d="M3 2.5l10 5.5-10 5.5V2.5z" />
    </svg>
  );
}

export function IconPause({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
      <rect x="2.5" y="2" width="4" height="12" rx="1.5" />
      <rect x="9.5" y="2" width="4" height="12" rx="1.5" />
    </svg>
  );
}

export function IconMusic({ size = 24, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5.5" cy="17.5" r="2.5" />
      <circle cx="17.5" cy="14.5" r="2.5" />
      <polyline points="8 17 8 5 20 2 20 14" />
    </svg>
  );
}

export function IconBreath({ size = 24, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      {/* Concentric arcs — like a breath expanding */}
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3a9 9 0 0 1 9 9" opacity="0.5" />
      <path d="M12 3a9 9 0 0 0-9 9" opacity="0.5" />
      <path d="M21 12a9 9 0 0 1-9 9" opacity="0.25" />
      <path d="M3 12a9 9 0 0 0 9 9" opacity="0.25" />
    </svg>
  );
}
