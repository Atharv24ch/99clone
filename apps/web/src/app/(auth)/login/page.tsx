import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Login | 99acres Clone",
  description: "Login to 99acres Clone to access your saved properties, post listings, and manage your account.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-50 py-12 px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-brand mx-auto mb-4 shadow-lg">
            <span className="text-xl font-bold text-white">99</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-500">Sign in to your 99acres Clone account</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
