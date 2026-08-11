import type { Metadata } from "next";
import { PostPropertyForm } from "@/components/forms/PostPropertyForm";

export const metadata: Metadata = {
  title: "Post a Property | 99acres Clone",
  description: "List your property for free and reach lakhs of genuine buyers and tenants.",
};

export default function PostPropertyPage() {
  return (
    <div className="bg-slate-50 py-10 min-h-screen">
      <div className="container-app">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold text-slate-900">Post Your Property</h1>
          <p className="mt-2 text-slate-500">It's free — reach lakhs of genuine buyers instantly</p>
        </div>
        <PostPropertyForm />
      </div>
    </div>
  );
}
