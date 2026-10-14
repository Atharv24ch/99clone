"use client";

import { useEffect, useRef } from "react";

/**
 * The aerial footage, pasted onto the sheet like the photograph on a deed.
 * Respects reduced-motion by holding the first frame.
 */
export function AffixedFootage({ src, className = "" }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      if (media.matches) video.pause();
      else void video.play().catch(() => undefined);
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return (
    <figure className={`relative bg-paper-sheet p-2 shadow-lift ring-1 ring-ink/10 ${className}`}>
      <video
        ref={ref}
        src={src}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
        aria-hidden="true"
        className="block aspect-[4/5] w-full object-cover saturate-[0.85]"
      />
      {/* Corner mounts */}
      <span className="absolute -left-1 -top-1 h-5 w-5 border-l-2 border-t-2 border-ink/25" aria-hidden="true" />
      <span className="absolute -bottom-1 -right-1 h-5 w-5 border-b-2 border-r-2 border-ink/25" aria-hidden="true" />
    </figure>
  );
}
