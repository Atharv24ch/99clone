"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import { leadsService } from "@/services/properties";
import { errorMessage } from "@/services/api";
import { PageTitle, EmptyState, ErrorState } from "@/components/dashboard/DashboardShell";
import { LEAD_STATUS_LABEL, LeadStatusPill } from "@/components/dashboard/LeadStatusPill";
import type { LeadStatus } from "@/types/user";

const STATUSES = Object.keys(LEAD_STATUS_LABEL) as LeadStatus[];

function LeadsInner() {
  const token = useAuthStore((s) => s.token);
  const router = useRouter();
  const params = useSearchParams();
  const status = (params.get("status") as LeadStatus | null) ?? undefined;
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const query = useInfiniteQuery({
    queryKey: ["leads", token, status],
    queryFn: ({ pageParam }) => leadsService.list(token!, { status, page: pageParam, limit: 25 }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    enabled: !!token,
  });

  const update = useMutation({
    mutationFn: ({ id, next }: { id: string; next: LeadStatus }) => leadsService.setStatus(id, next, token!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["leads"] });
      void queryClient.invalidateQueries({ queryKey: ["me-stats"] });
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const leads = query.data?.pages.flatMap((p) => p.data) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;

  return (
    <>
      <PageTitle title="Enquiries">
        <p className="tabular text-sm text-ink-soft">{query.isLoading ? "" : `${total.toLocaleString("en-IN")} total`}</p>
      </PageTitle>

      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        <button type="button" className="chip" aria-pressed={!status} onClick={() => router.replace("/dashboard/leads")}>All</button>
        {STATUSES.map((s) => (
          <button key={s} type="button" className="chip" aria-pressed={status === s} onClick={() => router.replace(`/dashboard/leads?status=${s}`)}>
            {LEAD_STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="mb-4 text-sm text-danger">{error}</p>}

      {query.isLoading ? (
        <div className="space-y-2">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-24" />)}</div>
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : leads.length === 0 ? (
        <EmptyState
          title={status ? `No ${LEAD_STATUS_LABEL[status].toLowerCase()} enquiries` : "No enquiries yet"}
          body="When someone contacts you from a live listing, their name, number and message land here."
        />
      ) : (
        <>
          <ul className="border-t border-ink/70">
            {leads.map((lead) => (
              <li key={lead.id} className="border-b border-rule py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{lead.name}</p>
                    <p className="tabular mt-0.5 flex flex-wrap gap-x-4 text-sm">
                      <a href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`} className="text-seal hover:underline">{lead.phone}</a>
                      {lead.email && <a href={`mailto:${lead.email}`} className="text-seal hover:underline">{lead.email}</a>}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <LeadStatusPill status={lead.status} />
                    <label className="sr-only" htmlFor={`status-${lead.id}`}>Update status</label>
                    <select
                      id={`status-${lead.id}`}
                      value={lead.status}
                      disabled={update.isPending}
                      onChange={(e) => update.mutate({ id: lead.id, next: e.target.value as LeadStatus })}
                      className="input-box !w-auto !py-1.5 text-sm"
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABEL[s]}</option>)}
                    </select>
                  </div>
                </div>
                {lead.message && <p className="mt-2 max-w-[70ch] text-sm text-ink">{lead.message}</p>}
                <p className="mt-2 text-xs text-ink-faint">
                  About <Link href={`/property/${lead.propertySlug}`} className="underline hover:text-ink">{lead.propertyTitle}</Link>
                  {" · "}
                  {new Date(lead.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                </p>
              </li>
            ))}
          </ul>
          {query.hasNextPage && (
            <div className="mt-6 flex justify-center">
              <button type="button" className="btn-ink" onClick={() => void query.fetchNextPage()} disabled={query.isFetchingNextPage}>
                {query.isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Show more
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default function LeadsPage() {
  return (
    <Suspense>
      <LeadsInner />
    </Suspense>
  );
}
