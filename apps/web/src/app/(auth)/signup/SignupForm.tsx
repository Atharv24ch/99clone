"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { apiFetch } from "@/services/api";
import type { User as UserType } from "@/types/user";

const ROLES = [
  { value: "buyer", label: "Buyer / Tenant", desc: "Looking to buy or rent" },
  { value: "seller", label: "Owner / Seller", desc: "Listing my property" },
  { value: "agent", label: "Agent / Broker", desc: "Real estate professional" },
  { value: "builder", label: "Builder / Developer", desc: "Building projects" },
];

export function SignupForm() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", role: "buyer", password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.firstName) errs["firstName"] = "First name is required";
    if (!form.email && !form.phone) errs["email"] = "Email or phone is required";
    if (form.password && form.password.length < 8) errs["password"] = "Password must be 8+ characters";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setIsLoading(true);

    try {
      const res = await apiFetch<{ data: { user: UserType; token: string } }>("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setAuth(res.data.user, res.data.token);
      router.push("/dashboard");
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setErrors({ submit: apiErr.message ?? "Registration failed. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card p-8">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Role selection */}
        <div>
          <p className="text-xs font-medium text-slate-600 mb-2">I am a...</p>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((role) => (
              <button
                key={role.value}
                type="button"
                id={`role-${role.value}`}
                onClick={() => setForm((f) => ({ ...f, role: role.value }))}
                className={[
                  "rounded-xl border p-3 text-left transition-all",
                  form.role === role.value
                    ? "border-brand-400 bg-brand-50"
                    : "border-slate-200 hover:border-slate-300",
                ].join(" ")}
              >
                <p className={`text-xs font-semibold ${form.role === role.value ? "text-brand-700" : "text-slate-800"}`}>
                  {role.label}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{role.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="signup-firstname" className="block text-xs font-medium text-slate-600 mb-1.5">
              First Name *
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input id="signup-firstname" type="text" value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                placeholder="Rahul" className={`input-base pl-10 ${errors["firstName"] ? "border-red-400" : ""}`} />
            </div>
            {errors["firstName"] && <p className="mt-1 text-xs text-red-500">{errors["firstName"]}</p>}
          </div>
          <div>
            <label htmlFor="signup-lastname" className="block text-xs font-medium text-slate-600 mb-1.5">
              Last Name
            </label>
            <input id="signup-lastname" type="text" value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              placeholder="Sharma" className="input-base" />
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="signup-email" className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input id="signup-email" type="email" value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="you@example.com"
              className={`input-base pl-10 ${errors["email"] ? "border-red-400" : ""}`} />
          </div>
          {errors["email"] && <p className="mt-1 text-xs text-red-500">{errors["email"]}</p>}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="signup-phone" className="block text-xs font-medium text-slate-600 mb-1.5">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input id="signup-phone" type="tel" value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+91 98765 43210"
              className="input-base pl-10" />
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="signup-password" className="block text-xs font-medium text-slate-600 mb-1.5">
            Password (optional for social login)
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input id="signup-password" type={showPassword ? "text" : "password"} value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Min. 8 characters"
              className={`input-base pl-10 pr-10 ${errors["password"] ? "border-red-400" : ""}`} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors["password"] && <p className="mt-1 text-xs text-red-500">{errors["password"]}</p>}
        </div>

        {errors["submit"] && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{errors["submit"]}</p>
        )}

        <button type="submit" disabled={isLoading} id="signup-submit-btn" className="btn-brand w-full gap-2 disabled:opacity-60">
          {isLoading
            ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            : <ArrowRight className="h-4 w-4" />
          }
          {isLoading ? "Creating account..." : "Create Account"}
        </button>

        <p className="text-center text-xs text-slate-400">
          By signing up, you agree to our{" "}
          <a href="/terms" className="text-brand-500 hover:underline">Terms</a> and{" "}
          <a href="/privacy" className="text-brand-500 hover:underline">Privacy Policy</a>
        </p>
      </form>
    </div>
  );
}
