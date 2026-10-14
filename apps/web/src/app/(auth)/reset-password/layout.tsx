import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
  // Keep the one-time token out of Referer headers on outbound requests
  referrer: "no-referrer",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
