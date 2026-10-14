"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/store/authStore";
import { propertiesService } from "@/services/properties";
import { PageTitle, EmptyState, ErrorState } from "@/components/dashboard/DashboardShell";
import { PropertyCard, PropertyCardSkeleton } from "@/components/property/PropertyCard";
import { useSavedProperties } from "@/hooks/useSavedProperties";

export default function SavedPage() {
  const token = useAuthStore((s) => s.token);
  const { savedIds } = useSavedProperties();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["saved-list", token],
    queryFn: () => propertiesService.saved(token!),
    enabled: !!token,
  });

  // Hide cards the user just unsaved, without waiting for the refetch
  const listings = (data?.data ?? []).filter((p) => savedIds.size === 0 || savedIds.has(p.id));

  return (
    <>
      <PageTitle title="Saved listings" />
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => <PropertyCardSkeleton key={i} />)}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : listings.length === 0 ? (
        <EmptyState
          title="No saved listings"
          body="Use the bookmark on any listing to keep it here for later."
          action={<Link href="/search" className="btn-seal">Browse listings</Link>}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>
      )}
    </>
  );
}
