import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";

import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Aangan to manage your listings, enquiries and saved homes.",
};

export default function LoginPage() {
  return (
    <>
      <h1 className="font-display text-[34px] leading-tight text-ink">Sign in</h1>
      <p className="mt-1 text-sm text-ink-soft">
        New here? <Link href="/signup" className="link-ink font-semibold">Create an account</Link>
      </p>
      <div className="mt-7">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </>
  );
}
