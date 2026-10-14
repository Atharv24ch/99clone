import { useId } from "react";

interface SealProps {
  /** Text set around the ring. Repeated to fill the circumference. */
  ring?: string;
  /** Short centre text (one or two words). */
  center?: string;
  /** Second centre line, smaller. */
  sub?: string;
  size?: number;
  tilt?: number;
  className?: string;
  /** Plays the stamp-down entrance once. */
  animate?: boolean;
  title?: string;
}

/**
 * Seal — the violet registry stamp. Used for verified listings and as the
 * product's signature mark. Drawn as SVG so it reads at any size.
 */
export function Seal({
  ring = "AANGAN REGISTRY · VERIFIED LISTING ·",
  center = "Verified",
  sub,
  size = 112,
  tilt = -8,
  className = "",
  animate = false,
  title,
}: SealProps) {
  const id = useId().replace(/:/g, "");
  const r = 50;
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={`text-seal ${animate ? "animate-stamp-in" : ""} ${className}`}
      style={{ transform: animate ? undefined : `rotate(${tilt}deg)`, ["--seal-tilt" as string]: `${tilt}deg` }}
    >
      <defs>
        <path id={`ring-${id}`} d={`M60 60 m-${r - 9} 0 a${r - 9} ${r - 9} 0 1 1 ${(r - 9) * 2} 0 a${r - 9} ${r - 9} 0 1 1 -${(r - 9) * 2} 0`} />
        {/* Uneven ink: a turbulence mask so the stamp never looks vector-perfect */}
        <filter id={`ink-${id}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.9 1.35" result="speckle" />
          <feComposite in="SourceGraphic" in2="speckle" operator="in" />
        </filter>
      </defs>
      <g filter={`url(#ink-${id})`} fill="none" stroke="currentColor">
        <circle cx="60" cy="60" r={r + 4} strokeWidth="2.2" />
        <circle cx="60" cy="60" r={r} strokeWidth="0.9" />
        <circle cx="60" cy="60" r={r - 17} strokeWidth="1.1" />
        <text fill="currentColor" stroke="none" fontSize="8.4" fontWeight="700" letterSpacing="1.6" style={{ fontFamily: "var(--font-hind)" }}>
          <textPath href={`#ring-${id}`} startOffset="0">
            {ring} {ring}
          </textPath>
        </text>
        <text
          x="60"
          y={sub ? 60 : 64}
          textAnchor="middle"
          fill="currentColor"
          stroke="none"
          fontSize={center.length > 8 ? 11 : 13}
          style={{ fontFamily: "var(--font-rozha)" }}
        >
          {center}
        </text>
        {sub && (
          <text x="60" y="73" textAnchor="middle" fill="currentColor" stroke="none" fontSize="7" fontWeight="600" letterSpacing="1" style={{ fontFamily: "var(--font-hind)" }}>
            {sub}
          </text>
        )}
      </g>
    </svg>
  );
}

/** Compact inline version for cards and rows. */
export function SealMark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-seal ${className}`}>
      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" className="-rotate-12">
        <circle cx="10" cy="10" r="8.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="10" cy="10" r="5.6" fill="none" stroke="currentColor" strokeWidth="0.9" />
        <path d="M7.2 10.2l1.9 1.9 3.8-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Verified
    </span>
  );
}
