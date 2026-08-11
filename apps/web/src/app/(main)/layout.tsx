import type { ReactNode } from "react";
import { BackgroundMedia } from "@/components/common/BackgroundMedia";
import { Navbar } from "@/components/common/Navbar";
import { Footer } from "@/components/common/Footer";

/**
 * (main) Route Group Layout
 * Renders the scroll-animated video background globally behind all
 * pages in this route group (/, /search, /property/[slug]).
 *
 * The root app/layout.tsx handles <html>, <body>, Providers, and global CSS.
 * This layout adds the cinematic background layer + glass nav on top.
 */
export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* ── Cinematic scroll-animated background video ─────────────────────── */}
      <BackgroundMedia />

      {/* ── Sticky glass navigation bar ───────────────────────────────────── */}
      <header className="glass-nav sticky top-0 z-50">
        <Navbar />
      </header>

      {/* ── Page content ──────────────────────────────────────────────────── */}
      <main className="relative z-0 flex-1">
        {children}
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <Footer />
    </>
  );
}
