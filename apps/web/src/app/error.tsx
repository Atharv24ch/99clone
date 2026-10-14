"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="container-app flex min-h-[70vh] flex-col items-center justify-center text-center">
      <h1 className="font-display text-[40px] leading-tight text-ink">This page didn&apos;t load</h1>
      <p className="mt-2 max-w-[46ch] text-ink-soft">
        Something went wrong on our side. Try again, and if it keeps happening, come back in a few minutes.
      </p>
      <div className="mt-7 flex gap-3">
        <button type="button" onClick={reset} className="btn-seal">Try again</button>
        <Link href="/" className="btn-ink">Home</Link>
      </div>
    </main>
  );
}
