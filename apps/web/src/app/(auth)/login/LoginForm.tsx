"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Chrome, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { apiFetch } from "@/services/api";
import type { User } from "@/types/user";

export function LoginForm() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.email) errs["email"] = "Email is required";
    if (!form.password) errs["password"] = "Password is required";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setIsLoading(true);

    try {
      const res = await apiFetch<{ data: { user: User; token: string } }>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      setAuth(res.data.user, res.data.token);
      router.push("/dashboard");
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setErrors({ submit: apiErr.message ?? "Invalid credentials. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card p-8">
      {/* Google OAuth */}
      <button
        type="button"
        id="google-login-btn"
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm mb-6"
      >
        <Chrome className="h-5 w-5 text-blue-500" />
        Continue with Google
      </button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-100" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-4 text-xs text-slate-400">or sign in with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Email */}
        <div>
          <label htmlFor="login-email" className="block text-xs font-medium text-slate-600 mb-1.5">
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="you@example.com"
              className={`input-base pl-10 ${errors["email"] ? "border-red-400" : ""}`}
            />
          </div>
          {errors["email"] && <p className="mt-1 text-xs text-red-500">{errors["email"]}</p>}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="text-xs font-medium text-slate-600">Password</label>
            <a href="/forgot-password" className="text-xs text-brand-500 hover:underline">Forgot password?</a>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              className={`input-base pl-10 pr-10 ${errors["password"] ? "border-red-400" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors["password"] && <p className="mt-1 text-xs text-red-500">{errors["password"]}</p>}
        </div>

        {errors["submit"] && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{errors["submit"]}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          id="login-submit-btn"
          className="btn-brand w-full gap-2 disabled:opacity-60"
        >
          {isLoading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don't have an account?{" "}
        <Link href="/(auth)/signup" className="font-medium text-brand-600 hover:underline">
          Create one free
        </Link>
      </p>
    </div>
  );
}
