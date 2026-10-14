import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";

import { SignupForm } from "./SignupForm";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create an Aangan account to post listings, receive enquiries and save homes.",
};

export default function SignupPage() {
  return (
    <>
      <h1 className="font-display text-[34px] leading-tight text-ink">Create an account</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Already registered? <Link href="/login" className="link-ink font-semibold">Sign in</Link>
      </p>
      <div className="mt-7">
        <Suspense>
          <SignupForm />
        </Suspense>
      </div>
    </>
  );
}
