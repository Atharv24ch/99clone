import type { ReactNode } from "react";

import { Logo } from "@/components/brand/Logo";
import { GuillocheBand, GuillocheRosette } from "@/components/paper/Guilloche";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <GuillocheRosette className="pointer-events-none absolute -left-40 top-24 h-[520px] w-[520px] text-stamp/[0.07]" size={520} />
      <header className="container-app flex h-16 items-center">
        <Logo />
      </header>
      <main className="relative flex flex-1 items-start justify-center px-4 pb-16 pt-6 sm:items-center sm:pt-0">
        <div className="sheet relative w-full max-w-[460px] overflow-hidden">
          <GuillocheBand className="h-5 w-full text-stamp/35" height={20} />
          <div className="px-6 pb-8 pt-6 sm:px-9">{children}</div>
        </div>
      </main>
    </div>
  );
}
