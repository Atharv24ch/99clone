"use client";

import { useEffect, useState } from "react";
import { List, Map as MapIcon, SlidersHorizontal, Loader2, X } from "lucide-react";

import { PropertyCard, PropertyCardSkeleton } from "@/components/property/PropertyCard";
import { SearchFilters } from "@/components/property/SearchFilters";
import { MapView } from "@/components/map/MapView";
import { usePropertySearch } from "@/hooks/usePropertySearch";
import { useFilters } from "@/hooks/useFilters";
import { useSearchView } from "@/store/filterStore";
import { LISTING_TYPE_LABEL, PROPERTY_TYPE_LABEL } from "@/types/property";
import type { PropertyFilters } from "@/types/property";

const SORT_OPTIONS: Array<{ value: NonNullable<PropertyFilters["sortBy"]>; label: string }> = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price, low to high" },
  { value: "price_desc", label: "Price, high to low" },
  { value: "popular", label: "Most viewed" },
];

function heading(filters: PropertyFilters): string {
  const what = filters.propertyType ? `${PROPERTY_TYPE_LABEL[filters.propertyType]}s` : "Properties";
  const how = filters.listingType ? ` ${LISTING_TYPE_LABEL[filters.listingType].toLowerCase()}` : "";
  const where = filters.locality ? ` in ${filters.locality}` : filters.city ? ` in ${filters.city}` : "";
  return `${what}${how}${where}`;
}

export function SearchResults() {
  const { filters, setFilters, resetFilters, activeFilterCount } = useFilters();
  const { mapVisible, setMapVisible } = useSearchView();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [localityDraft, setLocalityDraft] = useState(filters.locality ?? "");

  const { properties, total, isLoading, isError, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    usePropertySearch(filters);

  useEffect(() => setLocalityDraft(filters.locality ?? ""), [filters.locality]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Desktop filters */}
      <aside className="hidden w-[300px] shrink-0 border-r border-rule lg:block">
        <div className="sticky top-16 h-[calc(100vh-64px)]">
          <SearchFilters />
        </div>
      </aside>

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Close filters" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-sm animate-rise shadow-lift">
            <SearchFilters onClose={() => setDrawerOpen(false)} resultCount={total} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="border-b border-rule bg-paper px-4 pb-4 pt-6 sm:px-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setFilters({ locality: localityDraft.trim() || undefined });
            }}
            className="flex max-w-xl items-end gap-3"
            role="search"
          >
            <div className="flex-1">
              <label htmlFor="search-locality" className="field-label">Locality or city</label>
              <div className="relative">
                <input
                  id="search-locality"
                  value={localityDraft}
                  onChange={(e) => setLocalityDraft(e.target.value)}
                  placeholder="Any locality"
                  className="input-line pr-8 text-[17px]"
                  autoComplete="off"
                />
                {localityDraft && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocalityDraft("");
                      setFilters({ locality: undefined });
                    }}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-ink-faint hover:text-ink"
                    aria-label="Clear locality"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
            <button type="submit" className="btn-ink !py-2 text-sm">Update</button>
          </form>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-[28px] leading-tight text-ink sm:text-[34px]">{heading(filters)}</h1>
              <p className="tabular mt-1 flex items-center gap-2 text-sm text-ink-soft" aria-live="polite">
                {isLoading ? "Searching…" : `${total.toLocaleString("en-IN")} ${total === 1 ? "listing" : "listings"}`}
                {isFetching && !isLoading && !isFetchingNextPage && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-label="Updating" />}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setDrawerOpen(true)} className="btn-quiet border border-rule lg:hidden">
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
              </button>

              <label className="sr-only" htmlFor="search-sort">Sort by</label>
              <select
                id="search-sort"
                value={filters.sortBy ?? "newest"}
                onChange={(e) => setFilters({ sortBy: e.target.value as PropertyFilters["sortBy"] })}
                className="input-box !w-auto !py-2 text-sm"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              <div className="hidden overflow-hidden rounded-sheet border border-rule md:flex" role="group" aria-label="View">
                <button
                  type="button"
                  onClick={() => setMapVisible(false)}
                  aria-pressed={!mapVisible}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm ${!mapVisible ? "bg-ink text-paper-sheet" : "bg-paper-sheet text-ink-soft hover:text-ink"}`}
                >
                  <List className="h-4 w-4" aria-hidden="true" /> List
                </button>
                <button
                  type="button"
                  onClick={() => setMapVisible(true)}
                  aria-pressed={mapVisible}
                  className={`flex items-center gap-1.5 border-l border-rule px-3 py-2 text-sm ${mapVisible ? "bg-ink text-paper-sheet" : "bg-paper-sheet text-ink-soft hover:text-ink"}`}
                >
                  <MapIcon className="h-4 w-4" aria-hidden="true" /> Map
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1">
          <div className={`min-w-0 flex-1 px-4 py-6 sm:px-6 ${mapVisible ? "md:max-w-[560px] md:flex-none xl:max-w-[640px]" : ""}`}>
            {isLoading ? (
              <div className={mapVisible ? "space-y-4" : "grid gap-5 sm:grid-cols-2 xl:grid-cols-3"}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <PropertyCardSkeleton key={i} layout={mapVisible ? "row" : "slip"} />
                ))}
              </div>
            ) : isError ? (
              <div className="sheet mx-auto max-w-md p-8 text-center">
                <p className="font-display text-2xl text-ink">Couldn&apos;t load listings</p>
                <p className="mt-2 text-sm text-ink-soft">The server didn&apos;t respond. Your filters are kept.</p>
                <button type="button" onClick={() => void refetch()} className="btn-seal mt-5">Try again</button>
              </div>
            ) : properties.length === 0 ? (
              <div className="sheet mx-auto max-w-md p-8 text-center">
                <p className="font-display text-2xl text-ink">No listings match yet</p>
                <p className="mt-2 text-sm text-ink-soft">
                  Try a nearby locality, a wider budget, or fewer filters.
                </p>
                {activeFilterCount > 0 && (
                  <button type="button" onClick={resetFilters} className="btn-ink mt-5">Clear filters</button>
                )}
              </div>
            ) : (
              <>
                <div className={mapVisible ? "space-y-4" : "grid gap-5 sm:grid-cols-2 xl:grid-cols-3"}>
                  {properties.map((p) => (
                    <PropertyCard
                      key={p.id}
                      property={p}
                      layout={mapVisible ? "row" : "slip"}
                      selected={mapVisible && selectedId === p.id}
                      onSelect={mapVisible ? () => setSelectedId(p.id) : undefined}
                    />
                  ))}
                </div>
                {hasNextPage && (
                  <div className="mt-8 flex justify-center">
                    <button type="button" onClick={() => void fetchNextPage()} disabled={isFetchingNextPage} className="btn-ink">
                      {isFetchingNextPage ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                      {isFetchingNextPage ? "Loading" : `Show more (${(total - properties.length).toLocaleString("en-IN")} left)`}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {mapVisible && (
            <div className="sticky top-16 hidden h-[calc(100vh-64px)] flex-1 border-l border-rule md:block">
              <MapView
                properties={properties}
                selectedId={selectedId}
                onSelect={(p) => {
                  setSelectedId(p.id);
                  document.getElementById(`listing-${p.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                className="h-full w-full"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
