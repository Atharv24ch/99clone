"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import { accountService, leadsService } from "@/services/properties";
import { PageTitle, ErrorState } from "@/components/dashboard/DashboardShell";
import { LeadStatusPill } from "@/components/dashboard/LeadStatusPill";

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export function DashboardContent() {
  const { user, token } = useAuthStore();

  const stats = useQuery({
    queryKey: ["me-stats", token],
    queryFn: () => accountService.stats(token!),
    enabled: !!token,
  });
  const leads = useQuery({
    queryKey: ["leads", token, "recent"],
    queryFn: () => leadsService.list(token!, { limit: 5 }),
    enabled: !!token,
  });

  if (!user) return null;
  const s = stats.data?.data;

  const figures = [
    { label: "Live listings", value: s?.activeListings, href: "/dashboard/listings" },
    { label: "In review", value: s?.pendingListings, href: "/dashboard/listings" },
    { label: "New enquiries", value: s?.newLeads, href: "/dashboard/leads?status=new" },
    { label: "Listing views", value: s?.totalViews, href: "/dashboard/listings" },
    { label: "Saved homes", value: s?.savedProperties, href: "/dashboard/saved" },
  ];

  const profileGaps = [
    !user.phone && "Add a phone number so buyers can reach you",
    (user.role === "agent" || user.role === "builder") && !user.reraNumber && "Add your RERA registration number",
    (user.role === "agent" || user.role === "builder") && !user.agencyName && "Add your agency or firm name",
  ].filter(Boolean) as string[];

  return (
    <>
      <PageTitle title={`${greeting()}, ${user.firstName}`} />

      {stats.isError ? (
        <ErrorState onRetry={() => void stats.refetch()} />
      ) : (
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-sheet border border-rule bg-rule sm:grid-cols-3 xl:grid-cols-5">
          {figures.map((f) => (
            <Link key={f.label} href={f.href} className="group bg-paper-sheet px-4 py-5 transition-colors last:col-span-2 hover:bg-paper sm:last:col-span-1">
              <dt className="text-sm text-ink-soft group-hover:text-ink">{f.label}</dt>
              <dd className="tabular mt-1 font-display text-[34px] leading-none text-ink">
                {f.value === undefined ? <span className="skeleton inline-block h-8 w-12 align-middle" /> : f.value.toLocaleString("en-IN")}
              </dd>
            </Link>
          ))}
        </dl>
      )}

      {profileGaps.length > 0 && (
        <div className="mt-8 rounded-sheet bg-seal-wash/70 px-5 py-4">
          <p className="text-sm font-semibold text-seal-dark">Finish your profile</p>
          <ul className="mt-1.5 space-y-1 text-sm text-ink">
            {profileGaps.map((g) => <li key={g}>{g}</li>)}
          </ul>
          <Link href="/dashboard/profile" className="link-ink mt-2 inline-block text-sm font-semibold">Edit profile</Link>
        </div>
      )}

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl text-ink">Latest enquiries</h2>
          <Link href="/dashboard/leads" className="inline-flex items-center gap-1 text-sm font-semibold text-seal hover:underline">
            All enquiries <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {leads.isLoading ? (
          <div className="mt-4 space-y-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-16" />)}</div>
        ) : leads.isError ? (
          <div className="mt-4"><ErrorState onRetry={() => void leads.refetch()} /></div>
        ) : leads.data && leads.data.data.length > 0 ? (
          <ul className="mt-4 border-t border-ink/70">
            {leads.data.data.map((lead) => (
              <li key={lead.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 border-b border-rule py-3.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto_auto]">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{lead.name}</p>
                  <a href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`} className="tabular text-sm text-seal hover:underline">{lead.phone}</a>
                </div>
                <Link href={`/property/${lead.propertySlug}`} className="col-span-2 row-start-2 truncate text-sm text-ink-soft hover:text-ink hover:underline sm:col-span-1 sm:row-start-auto">
                  {lead.propertyTitle}
                </Link>
                <span className="tabular hidden text-xs text-ink-faint sm:block">
                  {new Date(lead.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
                <LeadStatusPill status={lead.status} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 border-t border-rule pt-4 text-sm text-ink-soft">
            No enquiries yet. They appear here as soon as someone contacts you about a live listing.
          </p>
        )}
      </section>
    </>
  );
}
