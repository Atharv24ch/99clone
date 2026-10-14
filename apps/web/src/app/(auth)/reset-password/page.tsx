"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { accountService } from "@/services/properties";
import { errorMessage } from "@/services/api";

function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
    return (
      <>
        <h1 className="font-display text-[34px] leading-tight text-ink">This link doesn&apos;t work</h1>
        <p className="mt-3 text-[15px] text-ink-soft">
          The reset link is incomplete. Open it straight from the email, or ask for a new one.
        </p>
        <Link href="/forgot-password" className="btn-seal mt-8 w-full">Request a new link</Link>
      </>
    );
  }

  if (done) {
    return (
      <div role="status">
        <h1 className="font-display text-[34px] leading-tight text-ink">Password updated</h1>
        <p className="mt-3 text-[15px] text-ink-soft">Sign in with your new password.</p>
        <Link href="/login" className="btn-seal mt-8 w-full">Sign in</Link>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (password.length < 8) errs["password"] = "Use at least 8 characters";
    if (confirm !== password) errs["confirm"] = "The two passwords don't match";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      await accountService.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setErrors({ submit: errorMessage(err, "We couldn't update the password. Please try again.") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="font-display text-[34px] leading-tight text-ink">Choose a new password</h1>
      <form onSubmit={onSubmit} className="mt-7 space-y-6" noValidate>
        <div>
          <label htmlFor="reset-password" className="field-label">New password</label>
          <div className="relative">
            <input
              id="reset-password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!errors["password"]}
              aria-describedby="reset-password-hint"
              className="input-line pr-9"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-ink-faint hover:text-ink"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
          <p id="reset-password-hint" className={`mt-1 text-xs ${errors["password"] ? "text-danger" : "text-ink-faint"}`}>
            {errors["password"] ?? "At least 8 characters"}
          </p>
        </div>
        <div>
          <label htmlFor="reset-confirm" className="field-label">Repeat it</label>
          <input
            id="reset-confirm"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={!!errors["confirm"]}
            aria-describedby={errors["confirm"] ? "reset-confirm-err" : undefined}
            className="input-line"
          />
          {errors["confirm"] && <p id="reset-confirm-err" className="mt-1 text-xs text-danger">{errors["confirm"]}</p>}
        </div>
        {errors["submit"] && (
          <p role="alert" className="rounded-sheet border border-danger/30 bg-danger/5 px-3 py-2.5 text-sm text-danger">
            {errors["submit"]}{" "}
            <Link href="/forgot-password" className="font-semibold underline">Request a new link</Link>
          </p>
        )}
        <button type="submit" disabled={loading} className="btn-seal w-full !py-3">
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {loading ? "Saving" : "Save new password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
