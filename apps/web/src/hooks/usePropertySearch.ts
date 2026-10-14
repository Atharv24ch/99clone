"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { propertiesService } from "@/services/properties";
import type { PropertyFilters } from "@/types/property";

const PAGE_SIZE = 20;

/**
 * usePropertySearch — paginated listings for the current filters.
 * Pages append ("Show more") instead of replacing earlier results.
 */
export function usePropertySearch(filters: PropertyFilters) {
  const query = useInfiniteQuery({
    queryKey: ["properties", filters],
    queryFn: ({ pageParam }) => propertiesService.list({ ...filters, page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    placeholderData: (prev) => prev,
  });

  const properties = query.data?.pages.flatMap((p) => p.data) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;

  return { ...query, properties, total };
}
