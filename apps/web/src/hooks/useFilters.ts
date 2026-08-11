"use client";

import { useCallback } from "react";
import { useFilterStore } from "@/store/filterStore";
import type { PropertyFilters } from "@/types/property";

/**
 * useFilters — convenience hook on top of the Zustand filter store.
 * Exposes filters, setter, reset, and computed derived values.
 */
export function useFilters() {
  const {
    filters,
    activeTab,
    mapVisible,
    searchQuery,
    selectedLocality,
    setFilters,
    resetFilters,
    setActiveTab,
    toggleMap,
    setSearchQuery,
    setSelectedLocality,
  } = useFilterStore();

  const updateFilter = useCallback(
    <K extends keyof PropertyFilters>(key: K, value: PropertyFilters[K]) => {
      setFilters({ [key]: value });
    },
    [setFilters]
  );

  const nextPage = useCallback(() => {
    setFilters({ page: (filters.page ?? 1) + 1 });
  }, [filters.page, setFilters]);

  const prevPage = useCallback(() => {
    setFilters({ page: Math.max(1, (filters.page ?? 1) - 1) });
  }, [filters.page, setFilters]);

  // Count of active non-default filters
  const activeFilterCount = Object.entries(filters).filter(([key, val]) => {
    if (key === "page" || key === "limit" || key === "sortBy" || key === "listingType") return false;
    return val !== undefined && val !== null && val !== "";
  }).length;

  return {
    filters,
    activeTab,
    mapVisible,
    searchQuery,
    selectedLocality,
    activeFilterCount,
    setFilters,
    updateFilter,
    resetFilters,
    setActiveTab,
    toggleMap,
    setSearchQuery,
    setSelectedLocality,
    nextPage,
    prevPage,
  };
}
