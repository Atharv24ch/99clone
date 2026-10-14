"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { useAuthStore } from "@/store/authStore";
import { propertiesService } from "@/services/properties";
import { errorMessage } from "@/services/api";
import { PageTitle, EmptyState, ErrorState } from "@/components/dashboard/DashboardShell";
import { formatListingPrice, listingRef, STATUS_LABEL } from "@/types/property";
import type { PropertyListItem, PropertyStatus } from "@/types/property";

const STATUS_TONE: Record<PropertyStatus, string> = {
  active: "border-stamp text-stamp-dark",
  pending_approval: "border-seal text-seal",
  rejected: "border-danger text-danger",
  draft: "border-ink-faint text-ink-faint",
  sold: "border-ink text-ink",
  rented: "border-ink text-ink",
  archived: "border-ink-faint text-ink-faint",
};

export default function MyListingsPage() {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["my-listings", token],
    queryFn: () => propertiesService.mine(token!),
    enabled: !!token,
  });

  const closeOut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "sold" | "rented" | "archived" }) =>
      propertiesService.setStatus(id, { status }, token!),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["my-listings"] }),
    onError: (err) => setError(errorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => propertiesService.remove(id, token!),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["my-listings"] }),
    onError: (err) => setError(errorMessage(err)),
  });

  const listings: PropertyListItem[] = data?.data ?? [];

  return (
    <>
      <PageTitle title="Your listings">
        <Link href="/dashboard/post-property" className="btn-ink !py-2 text-sm">Post another</Link>
      </PageTitle>

      {error && <p role="alert" className="mb-4 text-sm text-danger">{error}</p>}

      {isLoading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-20" />)}</div>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : listings.length === 0 ? (
        <EmptyState
          title="Nothing listed yet"
          body="Post a property and it will appear here while a moderator reviews it, then go live in search."
          action={<Link href="/dashboard/post-property" className="btn-seal">Post a property</Link>}
        />
      ) : (
        <ul className="border-t border-ink/70">
          {listings.map((p) => {
            const status = p.status ?? "pending_approval";
            const rental = p.listingType === "rent" || p.listingType === "pg" || p.listingType === "commercial_rent";
            return (
              <li key={p.id} className="grid gap-x-6 gap-y-2 border-b border-rule py-4 sm:grid-cols-[minmax(0,1fr)_auto]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`rounded-sheet border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] ${STATUS_TONE[status]}`}>
                      {STATUS_LABEL[status]}
                    </span>
                    <span className="font-typed text-[11px] text-ink-faint">{listingRef(p.id)}</span>
                  </div>
                  {status === "active" ? (
                    <Link href={`/property/${p.slug}`} className="mt-1.5 block truncate font-semibold text-ink hover:underline">{p.title}</Link>
                  ) : (
                    <p className="mt-1.5 truncate font-semibold text-ink">{p.title}</p>
                  )}
                  <p className="tabular mt-0.5 text-sm text-ink-soft">
                    {formatListingPrice(p.price, p.listingType)} · {p.locality}, {p.city}
                    {status === "active" && ` · ${(p.viewCount ?? 0).toLocaleString("en-IN")} views · ${(p.leadCount ?? 0).toLocaleString("en-IN")} enquiries`}
                  </p>
                </div>
                <div className="flex items-center gap-1 sm:justify-end">
                  {status === "active" && (
                    <button
                      type="button"
                      className="btn-quiet text-sm"
                      disabled={closeOut.isPending}
                      onClick={() => closeOut.mutate({ id: p.id, status: rental ? "rented" : "sold" })}
                    >
                      Mark {rental ? "rented" : "sold"}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-quiet text-sm text-danger hover:!text-danger"
                    disabled={remove.isPending}
                    onClick={() => {
                      if (window.confirm(`Delete "${p.title}"? It will be removed from search.`)) remove.mutate(p.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
