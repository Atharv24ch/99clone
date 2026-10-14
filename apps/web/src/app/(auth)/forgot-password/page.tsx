"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { accountService } from "@/services/properties";
import { errorMessage } from "@/services/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError("Enter the email you signed up with");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await accountService.forgotPassword(value);
      setSentTo(value);
    } catch (err) {
      setError(errorMessage(err, "We couldn't send the link. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  if (sentTo) {
    return (
      <div role="status">
        <h1 className="font-display text-[34px] leading-tight text-ink">Check your email</h1>
        <p className="mt-3 text-[15px] text-ink-soft">
          If an account exists for <span className="font-semibold text-ink">{sentTo}</span>, we&apos;ve sent a link to
          reset the password. It works once and expires in 30 minutes.
        </p>
        <p className="mt-6 text-sm text-ink-soft">
          Nothing arrived? Check spam, or{" "}
          <button type="button" onClick={() => setSentTo(null)} className="link-ink font-semibold">try again</button>.
        </p>
        <Link href="/login" className="btn-ink mt-8 w-full">Back to sign in</Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-display text-[34px] leading-tight text-ink">Reset your password</h1>
      <p className="mt-1 text-sm text-ink-soft">We&apos;ll email you a link to choose a new one.</p>
      <form onSubmit={onSubmit} className="mt-7 space-y-6" noValidate>
        <div>
          <label htmlFor="forgot-email" className="field-label">Email</label>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? "forgot-email-err" : undefined}
            placeholder="you@example.com"
            className="input-line"
          />
          {error && <p id="forgot-email-err" role="alert" className="mt-1 text-xs text-danger">{error}</p>}
        </div>
        <button type="submit" disabled={loading} className="btn-seal w-full !py-3">
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {loading ? "Sending link" : "Send reset link"}
        </button>
        <p className="text-center text-sm text-ink-soft">
          Remembered it? <Link href="/login" className="link-ink font-semibold">Sign in</Link>
        </p>
      </form>
    </>
  );
}
