import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Hind, Rozha_One, Courier_Prime } from "next/font/google";

import "./globals.css";
import { Providers } from "./providers";

const hind = Hind({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hind",
  display: "swap",
});

const rozha = Rozha_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-rozha",
  display: "swap",
});

const typed = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-typed",
  display: "swap",
});

const siteUrl = process.env["NEXT_PUBLIC_SITE_URL"] ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Aangan — Homes, plots and offices across India",
    template: "%s · Aangan",
  },
  description:
    "Search flats, houses, plots, PG and commercial space for sale or rent across India. See who posted each listing and contact them directly.",
  keywords: ["property", "flats for sale", "flats for rent", "real estate India", "plots", "PG"],
  openGraph: {
    title: "Aangan — Homes, plots and offices across India",
    description: "Search listings by locality, budget and configuration, then contact the owner or agent directly.",
    type: "website",
    siteName: "Aangan",
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image", title: "Aangan" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#EAEFE4",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN" className={`${hind.variable} ${rozha.variable} ${typed.variable}`}>
      <body className="flex min-h-screen flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
