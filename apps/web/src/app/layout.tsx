import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "99acres Clone — India's Real Estate Marketplace",
    template: "%s | 99acres Clone",
  },
  description:
    "Search millions of properties for sale and rent across India. Apartments, villas, plots, commercial spaces — verified listings with photos, maps, and agent contacts.",
  keywords: ["real estate", "property", "apartments", "buy property", "rent property", "India", "housing"],
  openGraph: {
    title: "99acres Clone — India's Real Estate Marketplace",
    description: "Find your dream home. Search from millions of verified property listings.",
    type: "website",
    siteName: "99acres Clone",
  },
  twitter: {
    card: "summary_large_image",
    title: "99acres Clone",
    description: "India's trusted real estate marketplace",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

/**
 * Root layout — only handles HTML shell, global CSS, and Providers.
 * Navbar, Footer, and BackgroundMedia are handled by route-group layouts
 * so each group can customize its chrome independently.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen flex flex-col antialiased bg-slate-950 text-white">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
