import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";

import { Navbar } from "@/components/common/Navbar";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · Aangan" },
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={<div className="h-16 border-b border-rule" />}>
        <Navbar />
      </Suspense>
      <main id="main" className="flex-1">
        <DashboardShell>{children}</DashboardShell>
      </main>
    </>
  );
}
