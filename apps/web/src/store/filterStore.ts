import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

import type { PropertyFilters } from "@/types/property";

interface FilterState {
  filters: PropertyFilters;
  activeTab: "buy" | "rent" | "pg" | "commercial" | "plot" | "projects";
  mapVisible: boolean;
  searchQuery: string;
  selectedLocality: string | null;

  // Actions
  setFilters: (filters: Partial<PropertyFilters>) => void;
  resetFilters: () => void;
  setActiveTab: (tab: FilterState["activeTab"]) => void;
  toggleMap: () => void;
  setSearchQuery: (q: string) => void;
  setSelectedLocality: (locality: string | null) => void;
}

const defaultFilters: PropertyFilters = {
  listingType: undefined,
  city: undefined,
  locality: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  minBedrooms: undefined,
  maxBedrooms: undefined,
  furnishingStatus: undefined,
  possessionStatus: undefined,
  sortBy: "newest",
  page: 1,
  limit: 20,
};

export const useFilterStore = create<FilterState>()(
  devtools(
    persist(
      (set) => ({
        filters: defaultFilters,
        activeTab: "buy",
        mapVisible: true,
        searchQuery: "",
        selectedLocality: null,

        setFilters: (newFilters) =>
          set((state) => ({
            filters: { ...state.filters, ...newFilters, page: 1 },
          })),

        resetFilters: () =>
          set({ filters: defaultFilters }),

        setActiveTab: (tab) =>
          set({
            activeTab: tab,
            filters: {
              ...defaultFilters,
              listingType:
                tab === "buy" ? "buy"
                : tab === "rent" ? "rent"
                : tab === "pg" ? "pg"
                : tab === "commercial" ? "commercial_buy"
                : tab === "plot" ? "plot_buy"
                : "new_project",
            },
          }),

        toggleMap: () => set((state) => ({ mapVisible: !state.mapVisible })),

        setSearchQuery: (q) => set({ searchQuery: q }),

        setSelectedLocality: (locality) =>
          set((state) => ({
            selectedLocality: locality,
            filters: { ...state.filters, locality: locality ?? undefined },
          })),
      }),
      {
        name: "acres99-filters",
        partialize: (state) => ({
          filters: state.filters,
          activeTab: state.activeTab,
        }),
      }
    ),
    { name: "FilterStore" }
  )
);
