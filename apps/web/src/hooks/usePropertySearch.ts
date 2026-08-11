"use client";

import { useQuery } from "@tanstack/react-query";
import { propertiesService } from "@/services/properties";
import { useFilterStore } from "@/store/filterStore";

/**
 * usePropertySearch — fetches paginated property listings
 * using TanStack Query for caching and background refetching.
 *
 * Query key includes all active filters, so any filter change
 * triggers a new fetch with stale-while-revalidate behavior.
 */
export function usePropertySearch() {
  const filters = useFilterStore((s) => s.filters);

  return useQuery({
    queryKey: ["properties", filters],
    queryFn: () => propertiesService.list(filters),
    staleTime: 30_000, // 30s — search results can be slightly stale
    gcTime: 5 * 60_000, // 5min cache
    placeholderData: (prev) => prev, // keep previous data while loading
  });
}

/**
 * usePropertyDetail — fetches a single property by slug.
 * Used in the SSR detail page to hydrate client state.
 */
export function usePropertyDetail(slug: string) {
  return useQuery({
    queryKey: ["property", slug],
    queryFn: () => propertiesService.getBySlug(slug),
    staleTime: 60_000,
    enabled: !!slug,
  });
}
