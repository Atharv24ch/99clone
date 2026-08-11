"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2, MessageSquare, Heart, TrendingUp,
  PlusCircle, Eye, CheckCircle, Clock, ArrowRight,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const STAT_CARDS = [
  { icon: Building2, label: "Active Listings", value: "3", color: "bg-brand-50 text-brand-600", trend: "+1 this week" },
  { icon: MessageSquare, label: "New Leads", value: "12", color: "bg-emerald-50 text-emerald-600", trend: "+5 today" },
  { icon: Eye, label: "Total Views", value: "1,842", color: "bg-sky-50 text-sky-600", trend: "+234 this week" },
  { icon: Heart, label: "Saved Properties", value: "7", color: "bg-violet-50 text-violet-600", trend: "" },
];

const QUICK_ACTIONS = [
  { label: "Post a Property", href: "/dashboard/post-property", icon: PlusCircle, primary: true },
  { label: "View My Listings", href: "/dashboard/listings", icon: Building2, primary: false },
  { label: "Check Leads", href: "/dashboard/leads", icon: MessageSquare, primary: false },
  { label: "Saved Properties", href: "/dashboard/saved", icon: Heart, primary: false },
];

export function DashboardContent() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-500" />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="container-app">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">
              Good {getGreeting()}, {user.firstName}! 👋
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Here's what's happening with your properties today.
            </p>
          </div>
          <Link href="/dashboard/post-property" id="dashboard-post-btn"
            className="btn-brand gap-2 self-start sm:self-auto">
            <PlusCircle className="h-4 w-4" />
            Post Property
          </Link>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STAT_CARDS.map(({ icon: Icon, label, value, color, trend }) => (
            <div key={label} className="card p-5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl mb-3 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="font-display text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              {trend && (
                <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {trend}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick actions */}
          <div className="card p-6 lg:col-span-1">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {QUICK_ACTIONS.map(({ label, href, icon: Icon, primary }) => (
                <Link key={label} href={href}
                  className={[
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                    primary
                      ? "bg-brand-500 text-white hover:bg-brand-600"
                      : "border border-slate-200 text-slate-700 hover:bg-slate-50",
                  ].join(" ")}>
                  <Icon className="h-4 w-4" />
                  {label}
                  <ArrowRight className="h-4 w-4 ml-auto opacity-50" />
                </Link>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div className="card p-6 lg:col-span-2">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Recent Leads</h2>
            <div className="space-y-3">
              {/* Placeholder lead items */}
              {[
                { name: "Priya Sharma", phone: "+91 98765 43210", property: "3 BHK Sector 62, Noida", time: "2h ago", status: "new" },
                { name: "Amit Kumar", phone: "+91 87654 32109", property: "2 BHK Indiranagar, Bangalore", time: "5h ago", status: "contacted" },
                { name: "Sunita Patel", phone: "+91 76543 21098", property: "Villa Juhu, Mumbai", time: "1d ago", status: "visited" },
              ].map((lead) => (
                <div key={lead.name} className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white border border-slate-100 font-semibold text-sm text-slate-700">
                    {lead.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{lead.name}</p>
                    <p className="text-xs text-slate-500 truncate">{lead.property}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={[
                      "rounded-md px-2 py-0.5 text-[10px] font-medium capitalize",
                      lead.status === "new" ? "bg-brand-50 text-brand-700"
                      : lead.status === "contacted" ? "bg-sky-50 text-sky-700"
                      : "bg-emerald-50 text-emerald-700",
                    ].join(" ")}>
                      {lead.status}
                    </span>
                    <span className="text-[10px] text-slate-400">{lead.time}</span>
                  </div>
                </div>
              ))}
              <Link href="/dashboard/leads"
                className="flex items-center justify-center gap-1 py-2 text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors">
                View all leads <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Profile completion */}
        <div className="mt-6 card p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Profile Completeness</h2>
            <span className="text-sm font-bold text-brand-600">65%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 mb-4">
            <div className="h-2 rounded-full bg-brand-500 transition-all duration-700" style={{ width: "65%" }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Add phone number", done: !!user.phone, href: "/dashboard/profile" },
              { label: "Verify email", done: user.isEmailVerified, href: "/dashboard/profile" },
              { label: "Add RERA number", done: !!user.reraNumber, href: "/dashboard/profile" },
            ].map(({ label, done, href }) => (
              <Link key={label} href={href}
                className={[
                  "flex items-center gap-2 rounded-xl p-3 text-xs font-medium transition-colors",
                  done ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                ].join(" ")}>
                <CheckCircle className={`h-4 w-4 flex-shrink-0 ${done ? "text-emerald-500" : "text-slate-400"}`} />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}
