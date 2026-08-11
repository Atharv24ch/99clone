"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Map, List, SlidersHorizontal, ArrowUpDown, X } from "lucide-react";
import { PropertyCard } from "@/components/property/PropertyCard";
import { SearchFilters } from "@/components/property/SearchFilters";
import { MapView } from "@/components/map/MapView";
import { PropertyCardSkeleton } from "@99acres/ui";
import { usePropertySearch } from "@/hooks/usePropertySearch";
import { useFilters } from "@/hooks/useFilters";
import type { PropertyListItem } from "@/types/property";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "popular", label: "Most Popular" },
];

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyListItem | null>(null);

  const {
    filters, activeTab, mapVisible,
    setFilters, toggleMap, activeFilterCount,
  } = useFilters();

  const { data, isLoading, isFetching } = usePropertySearch();

  const properties = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* ── Desktop Sidebar Filters ── */}
      <aside className="hidden lg:flex w-72 flex-col border-r border-slate-100 bg-white overflow-y-auto flex-shrink-0">
        <SearchFilters />
      </aside>

      {/* ── Mobile Filter Drawer ── */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl animate-slide-down overflow-y-auto">
            <SearchFilters onClose={() => setMobileFiltersOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Results toolbar */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Mobile filter button */}
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors lg:hidden"
              id="mobile-filter-btn"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Results count */}
            <div>
              {isLoading ? (
                <div className="h-4 w-32 rounded shimmer" />
              ) : (
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">{total.toLocaleString("en-IN")}</span>{" "}
                  properties found
                  {isFetching && !isLoading && (
                    <span className="ml-2 text-xs text-slate-400">Updating...</span>
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort */}
            <select
              value={filters.sortBy ?? "newest"}
              onChange={(e) => setFilters({ sortBy: e.target.value as "newest" })}
              id="search-sort-select"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Map/List toggle */}
            <div className="flex rounded-xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => !mapVisible && toggleMap()}
                id="toggle-list-view"
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${!mapVisible ? "bg-brand-500 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:block">List</span>
              </button>
              <button
                onClick={() => mapVisible && toggleMap()}
                id="toggle-map-view"
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-l border-slate-200 ${mapVisible ? "bg-brand-500 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                <Map className="h-4 w-4" />
                <span className="hidden sm:block">Map</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Property list */}
          <div className={`flex-1 overflow-y-auto ${mapVisible ? "hidden xl:block xl:w-[420px] xl:flex-none" : ""}`}>
            <div className="p-4">
              {isLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <PropertyCardSkeleton key={i} />
                  ))}
                </div>
              ) : properties.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="text-5xl mb-4">🏠</div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">No properties found</h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Try adjusting your filters or searching in a different area
                  </p>
                  <button
                    onClick={() => setFilters({})}
                    className="btn-brand px-6 text-sm"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <>
                  <div className={`grid gap-4 ${mapVisible ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
                    {properties.map((property) => (
                      <PropertyCard
                        key={property.id}
                        property={property}
                        compact={mapVisible}
                        className={selectedProperty?.id === property.id ? "ring-2 ring-brand-400" : ""}
                        onClick={() => setSelectedProperty(property)}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {data && data.hasMore && (
                    <div className="mt-6 flex justify-center">
                      <button
                        onClick={() => setFilters({ page: (filters.page ?? 1) + 1 })}
                        className="btn-brand px-8"
                        id="load-more-btn"
                      >
                        Load More Properties
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Map panel */}
          {mapVisible && (
            <div className="flex-1 overflow-hidden">
              <MapView
                properties={properties}
                className="h-full rounded-none"
                onPropertyClick={(prop) => setSelectedProperty(prop)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-500" />
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}
