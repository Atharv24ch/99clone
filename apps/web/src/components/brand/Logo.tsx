import Link from "next/link";

/**
 * Aangan mark: a courtyard house in plan view — rooms around an open centre.
 */
export function AanganMark({ className = "", size = 26 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 28 28" width={size} height={size} className={className} aria-hidden="true">
      <rect x="1.5" y="1.5" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <rect x="9" y="9" width="10" height="10" fill="currentColor" opacity="0.14" />
      <rect x="9" y="9" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M1.5 9H9M19 9h7.5M1.5 19H9M19 19h7.5M9 1.5V9M19 1.5V9M9 19v7.5M19 19v7.5" stroke="currentColor" strokeWidth="1.1" />
      <path d="M12.5 26.5v-3h3v3" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function Logo({ className = "", tone = "ink" }: { className?: string; tone?: "ink" | "paper" }) {
  const color = tone === "paper" ? "text-paper-sheet" : "text-ink";
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 ${color} ${className}`} aria-label="Aangan home">
      <AanganMark className={tone === "paper" ? "text-paper-sheet" : "text-stamp"} />
      <span className="font-display text-[26px] leading-none tracking-[-0.01em] translate-y-[2px]">Aangan</span>
    </Link>
  );
}
