"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import { accountService } from "@/services/properties";
import { errorMessage } from "@/services/api";
import { safeNext } from "@/lib/safeNext";

export function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({ email: "", password: "" });
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs["email"] = "Enter the email you signed up with";
    if (!form.password) errs["password"] = "Enter your password";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const res = await accountService.login({ email: form.email.trim(), password: form.password });
      setAuth(res.data.user, res.data.token);
      router.replace(next);
    } catch (err) {
      setErrors({ submit: errorMessage(err, "Sign-in failed. Please try again.") });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div>
        <label htmlFor="login-email" className="field-label">Email</label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          aria-invalid={!!errors["email"]}
          aria-describedby={errors["email"] ? "login-email-err" : undefined}
          placeholder="you@example.com"
          className="input-line"
        />
        {errors["email"] && <p id="login-email-err" className="mt-1 text-xs text-danger">{errors["email"]}</p>}
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="login-password" className="field-label">Password</label>
          <Link href="/forgot-password" className="text-xs text-seal hover:underline">Forgot password?</Link>
        </div>
        <div className="relative">
          <input
            id="login-password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            aria-invalid={!!errors["password"]}
            aria-describedby={errors["password"] ? "login-password-err" : undefined}
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
        {errors["password"] && <p id="login-password-err" className="mt-1 text-xs text-danger">{errors["password"]}</p>}
      </div>

      {errors["submit"] && (
        <p role="alert" className="rounded-sheet border border-danger/30 bg-danger/5 px-3 py-2.5 text-sm text-danger">
          {errors["submit"]}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-seal w-full !py-3">
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {loading ? "Signing in" : "Sign in"}
      </button>
    </form>
  );
}
