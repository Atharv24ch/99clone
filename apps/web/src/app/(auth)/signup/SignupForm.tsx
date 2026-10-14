"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import { accountService } from "@/services/properties";
import { errorMessage } from "@/services/api";
import { safeNext } from "@/lib/safeNext";

const ROLES = [
  { value: "buyer", label: "Buying or renting" },
  { value: "seller", label: "Owner" },
  { value: "agent", label: "Agent or broker" },
  { value: "builder", label: "Builder" },
] as const;

type Role = (typeof ROLES)[number]["value"];

export function SignupForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: "buyer" as Role,
  });
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.firstName.trim()) errs["firstName"] = "Enter your first name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs["email"] = "Enter a valid email address";
    if (form.phone && !/^\+?[\d\s\-()]{8,20}$/.test(form.phone.trim())) errs["phone"] = "Enter a phone number with at least 8 digits";
    if (form.password.length < 8) errs["password"] = "Use at least 8 characters";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const res = await accountService.register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim() || undefined,
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
        role: form.role,
      });
      setAuth(res.data.user, res.data.token);
      router.replace(next);
    } catch (err) {
      setErrors({ submit: errorMessage(err, "We couldn't create your account. Please try again.") });
      setLoading(false);
    }
  };

  const err = (key: string) =>
    errors[key] ? <p id={`signup-${key}-err`} className="mt-1 text-xs text-danger">{errors[key]}</p> : null;

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <fieldset>
        <legend className="field-label">I am</legend>
        <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              role="radio"
              aria-checked={form.role === r.value}
              onClick={() => setForm((f) => ({ ...f, role: r.value }))}
              className="chip !justify-start !py-2"
            >
              {r.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-5">
        <div>
          <label htmlFor="signup-firstName" className="field-label">First name</label>
          <input id="signup-firstName" autoComplete="given-name" value={form.firstName} onChange={set("firstName")}
            aria-invalid={!!errors["firstName"]} aria-describedby={errors["firstName"] ? "signup-firstName-err" : undefined} className="input-line" />
          {err("firstName")}
        </div>
        <div>
          <label htmlFor="signup-lastName" className="field-label">Last name</label>
          <input id="signup-lastName" autoComplete="family-name" value={form.lastName} onChange={set("lastName")} className="input-line" />
        </div>
      </div>

      <div>
        <label htmlFor="signup-email" className="field-label">Email</label>
        <input id="signup-email" type="email" autoComplete="email" value={form.email} onChange={set("email")}
          aria-invalid={!!errors["email"]} aria-describedby={errors["email"] ? "signup-email-err" : undefined}
          placeholder="you@example.com" className="input-line" />
        {err("email")}
      </div>

      <div>
        <label htmlFor="signup-phone" className="field-label">Phone (optional)</label>
        <input id="signup-phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set("phone")}
          aria-invalid={!!errors["phone"]} aria-describedby={errors["phone"] ? "signup-phone-err" : undefined}
          placeholder="+91 98765 43210" className="input-line" />
        {err("phone")}
      </div>

      <div>
        <label htmlFor="signup-password" className="field-label">Password</label>
        <div className="relative">
          <input id="signup-password" type={show ? "text" : "password"} autoComplete="new-password" value={form.password} onChange={set("password")}
            aria-invalid={!!errors["password"]} aria-describedby="signup-password-hint" className="input-line pr-9" />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-ink-faint hover:text-ink"
            aria-label={show ? "Hide password" : "Show password"}>
            {show ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
        <p id="signup-password-hint" className={`mt-1 text-xs ${errors["password"] ? "text-danger" : "text-ink-faint"}`}>
          {errors["password"] ?? "At least 8 characters"}
        </p>
      </div>

      {errors["submit"] && (
        <p role="alert" className="rounded-sheet border border-danger/30 bg-danger/5 px-3 py-2.5 text-sm text-danger">
          {errors["submit"]}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-seal w-full !py-3">
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {loading ? "Creating account" : "Create account"}
      </button>
    </form>
  );
}
