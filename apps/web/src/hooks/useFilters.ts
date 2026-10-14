"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { PropertyFilters } from "@/types/property";
import { COUNTED_KEYS, filtersFromParams } from "@/lib/filters";

export { filtersFromParams };

/**
 * useFilters — reads and writes search filters in the URL so results are
 * shareable, back-button friendly, and match what the home search sent.
 */
export function useFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const paramString = searchParams.toString();

  const filters = useMemo(() => filtersFromParams(new URLSearchParams(paramString)), [paramString]);

  const setFilters = useCallback(
    (patch: Partial<PropertyFilters>) => {
      const next = new URLSearchParams(paramString);
      next.delete("q");
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === null || value === "" || value === false) next.delete(key);
        else next.set(key, String(value));
      }
      if (patch.locality !== undefined) next.delete("q");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [paramString, pathname, router]
  );

  const resetFilters = useCallback(() => {
    const keep = new URLSearchParams();
    const lt = new URLSearchParams(paramString).get("listingType");
    if (lt) keep.set("listingType", lt);
    const qs = keep.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [paramString, pathname, router]);

  const activeFilterCount = COUNTED_KEYS.filter((k) => {
    const v = filters[k];
    return v !== undefined && v !== "";
  }).length - (filters.minBedrooms !== undefined && filters.maxBedrooms !== undefined ? 1 : 0)
    - (filters.minPrice !== undefined && filters.maxPrice !== undefined ? 1 : 0);

  return { filters, setFilters, resetFilters, activeFilterCount };
}
