import type { ReactNode } from "react";
import { Suspense } from "react";

import { Navbar } from "@/components/common/Navbar";
import { Footer } from "@/components/common/Footer";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={<div className="h-16 border-b border-rule" />}>
        <Navbar />
      </Suspense>
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
