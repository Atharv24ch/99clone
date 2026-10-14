"use client";

import { X } from "lucide-react";

import { useFilters } from "@/hooks/useFilters";
import type { FurnishingStatus, ListingType, PossessionStatus, PropertyType } from "@/types/property";
import { FURNISHING_LABEL, POSSESSION_LABEL, isRental } from "@/types/property";

const SALE_BUDGETS = [
  { label: "Under ₹50 L", min: undefined, max: 5_000_000 },
  { label: "₹50 L – 1 Cr", min: 5_000_000, max: 10_000_000 },
  { label: "₹1 – 2 Cr", min: 10_000_000, max: 20_000_000 },
  { label: "₹2 – 5 Cr", min: 20_000_000, max: 50_000_000 },
  { label: "Above ₹5 Cr", min: 50_000_000, max: undefined },
];

const RENT_BUDGETS = [
  { label: "Under ₹15k", min: undefined, max: 15_000 },
  { label: "₹15k – 30k", min: 15_000, max: 30_000 },
  { label: "₹30k – 60k", min: 30_000, max: 60_000 },
  { label: "₹60k – 1 L", min: 60_000, max: 100_000 },
  { label: "Above ₹1 L", min: 100_000, max: undefined },
];

const PROPERTY_TYPES: Array<{ value: PropertyType; label: string }> = [
  { value: "apartment", label: "Apartment" },
  { value: "independent_house", label: "Independent house" },
  { value: "villa", label: "Villa" },
  { value: "plot", label: "Plot" },
  { value: "commercial_office", label: "Office" },
  { value: "commercial_shop", label: "Shop" },
];

const LISTING_TYPES: Array<{ value: ListingType; label: string }> = [
  { value: "buy", label: "Buy" },
  { value: "rent", label: "Rent" },
  { value: "pg", label: "PG" },
  { value: "commercial_buy", label: "Commercial" },
  { value: "plot_buy", label: "Plots" },
  { value: "new_project", label: "New projects" },
];

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b border-rule px-5 py-5">
      <legend className="field-label float-left mb-3 w-full">{title}</legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

export function SearchFilters({ onClose, resultCount }: { onClose?: () => void; resultCount?: number }) {
  const { filters, setFilters, resetFilters, activeFilterCount } = useFilters();
  const budgets = filters.listingType && isRental(filters.listingType) ? RENT_BUDGETS : SALE_BUDGETS;

  return (
    <div className="flex h-full flex-col bg-paper-sheet">
      <div className="flex items-center justify-between border-b border-rule px-5 py-4">
        <h2 className="font-display text-xl text-ink">Refine</h2>
        <div className="flex items-center gap-1">
          {activeFilterCount > 0 && (
            <button type="button" onClick={resetFilters} className="btn-quiet !px-2 !py-1 text-sm text-seal">
              Clear all
            </button>
          )}
          {onClose && (
            <button type="button" onClick={onClose} className="btn-quiet !p-1.5" aria-label="Close filters">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Group title="Looking to">
          <div className="flex flex-wrap gap-2">
            {LISTING_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                className="chip"
                aria-pressed={filters.listingType === t.value}
                onClick={() =>
                  setFilters({
                    listingType: filters.listingType === t.value ? undefined : t.value,
                    minPrice: undefined,
                    maxPrice: undefined,
                  })
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        </Group>

        <Group title="Budget">
          <div className="grid grid-cols-2 gap-2">
            {budgets.map((b) => {
              const active = filters.minPrice === b.min && filters.maxPrice === b.max;
              return (
                <button
                  key={b.label}
                  type="button"
                  className="chip !justify-start"
                  aria-pressed={active}
                  onClick={() => setFilters({ minPrice: active ? undefined : b.min, maxPrice: active ? undefined : b.max })}
                >
                  {b.label}
                </button>
              );
            })}
          </div>
        </Group>

        <Group title="Bedrooms">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((n) => {
              const active = filters.minBedrooms === n && filters.maxBedrooms === n;
              return (
                <button
                  key={n}
                  type="button"
                  className="chip tabular min-w-[64px]"
                  aria-pressed={active}
                  onClick={() => setFilters({ minBedrooms: active ? undefined : n, maxBedrooms: active ? undefined : n })}
                >
                  {n} BHK
                </button>
              );
            })}
            {(() => {
              const active = filters.minBedrooms === 5 && filters.maxBedrooms === undefined;
              return (
                <button
                  type="button"
                  className="chip tabular min-w-[64px]"
                  aria-pressed={active}
                  onClick={() => setFilters({ minBedrooms: active ? undefined : 5, maxBedrooms: undefined })}
                >
                  5+ BHK
                </button>
              );
            })()}
          </div>
        </Group>

        <Group title="Property type">
          <div className="flex flex-wrap gap-2">
            {PROPERTY_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                className="chip"
                aria-pressed={filters.propertyType === t.value}
                onClick={() => setFilters({ propertyType: filters.propertyType === t.value ? undefined : t.value })}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Group>

        <Group title="Furnishing">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(FURNISHING_LABEL) as FurnishingStatus[]).map((f) => (
              <button
                key={f}
                type="button"
                className="chip"
                aria-pressed={filters.furnishingStatus === f}
                onClick={() => setFilters({ furnishingStatus: filters.furnishingStatus === f ? undefined : f })}
              >
                {FURNISHING_LABEL[f]}
              </button>
            ))}
          </div>
        </Group>

        <Group title="Possession">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(POSSESSION_LABEL) as PossessionStatus[]).map((p) => (
              <button
                key={p}
                type="button"
                className="chip"
                aria-pressed={filters.possessionStatus === p}
                onClick={() => setFilters({ possessionStatus: filters.possessionStatus === p ? undefined : p })}
              >
                {POSSESSION_LABEL[p]}
              </button>
            ))}
          </div>
        </Group>

        <div className="px-5 py-5">
          <label className="flex cursor-pointer items-center gap-3 text-[15px] text-ink">
            <input
              type="checkbox"
              checked={!!filters.verifiedOnly}
              onChange={(e) => setFilters({ verifiedOnly: e.target.checked || undefined })}
              className="h-4 w-4 rounded-[2px] border-ink/40 accent-[rgb(var(--seal))]"
            />
            Only listings with the registry seal
          </label>
        </div>
      </div>

      {onClose && (
        <div className="border-t border-rule p-4">
          <button type="button" onClick={onClose} className="btn-seal w-full">
            {resultCount !== undefined ? `Show ${resultCount.toLocaleString("en-IN")} listings` : "Show listings"}
          </button>
        </div>
      )}
    </div>
  );
}
