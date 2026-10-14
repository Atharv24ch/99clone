import Link from "next/link";

import { Logo } from "@/components/brand/Logo";
import { Seal } from "@/components/paper/Seal";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="container-app flex h-16 items-center">
        <Logo />
      </header>
      <main className="container-app flex flex-1 flex-col items-center justify-center pb-20 text-center">
        <Seal size={132} center="Not found" sub="NO RECORD" ring="NO SUCH ENTRY · AANGAN REGISTRY ·" />
        <h1 className="mt-6 font-display text-[40px] leading-tight text-ink">There&apos;s no entry at this address</h1>
        <p className="mt-2 max-w-[46ch] text-ink-soft">
          The listing may have been sold, rented or taken down, or the link is mistyped.
        </p>
        <div className="mt-7 flex gap-3">
          <Link href="/search" className="btn-seal">Search listings</Link>
          <Link href="/" className="btn-ink">Home</Link>
        </div>
      </main>
    </div>
  );
}
