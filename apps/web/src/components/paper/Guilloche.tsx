/**
 * Guilloche — the interference line-work printed on Indian stamp paper.
 * Generated as SVG paths (no raster), so it scales cleanly and tints from tokens.
 */

function wavePath(width: number, height: number, amp: number, freq: number, phase: number, yBase: number): string {
  const steps = Math.max(48, Math.round(width / 6));
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * width;
    const t = (i / steps) * Math.PI * 2 * freq + phase;
    const y = yBase + Math.sin(t) * amp + Math.sin(t * 2.5 + phase) * amp * 0.35;
    d += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${Math.max(0, Math.min(height, y)).toFixed(1)}`;
  }
  return d;
}

/** A horizontal guilloche band: overlapping phase-shifted waves. */
export function GuillocheBand({
  className = "",
  height = 28,
  lines = 9,
}: {
  className?: string;
  height?: number;
  lines?: number;
}) {
  const width = 1200;
  const paths = Array.from({ length: lines }, (_, i) =>
    wavePath(width, height, height * 0.32, 14, (i / lines) * Math.PI * 2, height / 2)
  );
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

/** A circular rosette, the centre-piece of a stamp-paper header. */
export function GuillocheRosette({ className = "", size = 220 }: { className?: string; size?: number }) {
  const c = size / 2;
  const rings = 26;
  const paths: string[] = [];
  for (let k = 0; k < rings; k++) {
    const rot = (k / rings) * Math.PI * 2;
    let d = "";
    const steps = 240;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const r = c * (0.55 + 0.38 * Math.cos(7 * t) * Math.sin(3 * t + rot) * 0.5 + 0.12 * Math.sin(11 * t + rot));
      const x = c + r * Math.cos(t + rot * 0.15);
      const y = c + r * Math.sin(t + rot * 0.15);
      d += `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    }
    paths.push(d + "Z");
  }
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} aria-hidden="true" focusable="false">
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth={0.45} />
      ))}
    </svg>
  );
}

/** A guilloche frame around a sheet: four bands inside a double rule. */
export function GuillocheFrame({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden="true">
      <GuillocheBand className="absolute inset-x-0 top-0 h-5 w-full text-stamp/35" height={20} />
      <GuillocheBand className="absolute inset-x-0 bottom-0 h-5 w-full text-stamp/35" height={20} />
      <div className="absolute inset-[6px] border border-stamp/40" />
      <div className="absolute inset-[24px] border border-stamp/25" />
    </div>
  );
}
