import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = {
  title: "Sign Up | 99acres Clone",
  description: "Create a free account to post property listings, save searches, and connect with buyers or agents.",
};

export default function SignupPage() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-brand mx-auto mb-4 shadow-lg">
            <span className="text-xl font-bold text-white">99</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="mt-2 text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/(auth)/login" className="text-brand-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
