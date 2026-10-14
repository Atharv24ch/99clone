"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/store/authStore";
import { propertiesService } from "@/services/properties";
import { errorMessage } from "@/services/api";
import { PageTitle, EmptyState, ErrorState } from "@/components/dashboard/DashboardShell";
import { formatListingPrice, listingRef, LISTING_TYPE_LABEL, PROPERTY_TYPE_LABEL } from "@/types/property";

export default function ModerationPage() {
  const { user, token } = useAuthStore();
  const queryClient = useQueryClient();
  const [verify, setVerify] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["pending", token],
    queryFn: () => propertiesService.pending(token!),
    enabled: !!token && isAdmin,
  });

  const decide = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      propertiesService.setStatus(
        id,
        approve ? { status: "active", isVerified: verify[id] ?? false } : { status: "rejected" },
        token!
      ),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["pending"] }),
    onError: (err) => setError(errorMessage(err)),
  });

  if (!isAdmin) {
    return <EmptyState title="Moderators only" body="This page is for reviewing new listings before they go live." />;
  }

  const items = data?.data ?? [];

  return (
    <>
      <PageTitle title="Moderation">
        <p className="tabular text-sm text-ink-soft">{isLoading ? "" : `${items.length} waiting`}</p>
      </PageTitle>

      {error && <p role="alert" className="mb-4 text-sm text-danger">{error}</p>}

      {isLoading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-24" />)}</div>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <EmptyState title="Queue is clear" body="New listings land here before they appear in search." />
      ) : (
        <ul className="border-t border-ink/70">
          {items.map((p) => (
            <li key={p.id} className="grid gap-4 border-b border-rule py-4 md:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-w-0">
                <p className="font-typed text-[11px] text-ink-faint">{listingRef(p.id)} · submitted {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN") : ""}</p>
                <p className="mt-1 font-semibold text-ink">{p.title}</p>
                <p className="tabular mt-0.5 text-sm text-ink-soft">
                  {formatListingPrice(p.price, p.listingType)} · {LISTING_TYPE_LABEL[p.listingType]} · {PROPERTY_TYPE_LABEL[p.propertyType]} · {p.locality}, {p.city}
                </p>
                <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={verify[p.id] ?? false}
                    onChange={(e) => setVerify((v) => ({ ...v, [p.id]: e.target.checked }))}
                    className="h-4 w-4 accent-[rgb(var(--seal))]"
                  />
                  Grant the registry seal (details checked)
                </label>
              </div>
              <div className="flex items-start gap-2">
                <button type="button" className="btn-seal !py-2 text-sm" disabled={decide.isPending} onClick={() => decide.mutate({ id: p.id, approve: true })}>
                  Publish
                </button>
                <button type="button" className="btn-quiet border border-rule text-sm" disabled={decide.isPending} onClick={() => decide.mutate({ id: p.id, approve: false })}>
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
