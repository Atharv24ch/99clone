import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * View preferences for the search page. Filters themselves live in the URL
 * (see hooks/useFilters.ts); this store only remembers how results are shown.
 */
interface SearchViewState {
  mapVisible: boolean;
  setMapVisible: (visible: boolean) => void;
}

export const useSearchView = create<SearchViewState>()(
  persist(
    (set) => ({
      mapVisible: false,
      setMapVisible: (mapVisible) => set({ mapVisible }),
    }),
    { name: "aangan-search-view" }
  )
);
