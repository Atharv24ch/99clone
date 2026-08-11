"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * BackgroundMedia
 * Fixed full-screen background layer rendered behind all page content (z-index: -10).
 * - Plays a looping silent video from /assets/hero-bg.mp4
 * - Applies scroll-linked scale zoom (1 → 1.15) and vertical parallax (0% → 15%)
 * - A dark gradient overlay guarantees text contrast at all scroll positions
 * - Falls back gracefully if the browser blocks autoplay (video just won't play)
 */
export function BackgroundMedia() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();

  // Subtle zoom: 1x at top → 1.15x as user scrolls
  const scale = useTransform(scrollY, [0, 800], [1, 1.15]);

  // Vertical parallax: video drifts down by 15% of viewport as user scrolls
  const y = useTransform(scrollY, [0, 800], ["0%", "15%"]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
    >
      {/* Scroll-animated video wrapper */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        style={{ scale, y }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src="/assets/hero-bg.mp4"
        />
      </motion.div>

      {/* Dark gradient overlay — guarantees text contrast */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.40) 50%, rgba(2,6,23,0.90) 100%)",
        }}
      />
    </div>
  );
}
