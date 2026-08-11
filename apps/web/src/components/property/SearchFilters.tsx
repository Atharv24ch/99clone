"use client";

import React, { useState } from "react";
import { X, SlidersHorizontal, RotateCcw, ChevronDown } from "lucide-react";
import { useFilters } from "@/hooks/useFilters";
import type { FurnishingStatus, PossessionStatus, PropertyType } from "@/types/property";

const PRICE_RANGES = [
  { label: "Under ₹50L", min: 0, max: 5_000_000 },
  { label: "₹50L – ₹1Cr", min: 5_000_000, max: 10_000_000 },
  { label: "₹1Cr – ₹2Cr", min: 10_000_000, max: 20_000_000 },
  { label: "₹2Cr – ₹5Cr", min: 20_000_000, max: 50_000_000 },
  { label: "₹5Cr+", min: 50_000_000, max: undefined },
];

const BHK_OPTIONS = [1, 2, 3, 4, 5];

const PROPERTY_TYPES: Array<{ value: PropertyType; label: string }> = [
  { value: "apartment", label: "Apartment" },
  { value: "independent_house", label: "Independent House" },
  { value: "villa", label: "Villa" },
  { value: "plot", label: "Plot / Land" },
  { value: "commercial_office", label: "Commercial Office" },
];

export function SearchFilters({ onClose }: { onClose?: () => void }) {
  const { filters, setFilters, resetFilters, activeFilterCount } = useFilters();
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    bhk: true,
    type: true,
    furnishing: false,
    possession: false,
  });

  const toggleSection = (key: keyof typeof expandedSections) => {
    setExpandedSections((s) => ({ ...s, [key]: !s[key] }));
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-900">Filters</h2>
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 transition-colors"
              id="filter-reset-btn"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              aria-label="Close filters"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable filter sections */}
      <div className="flex-1 overflow-y-auto">

        {/* Budget / Price */}
        <FilterSection
          title="Budget"
          expanded={expandedSections.price}
          onToggle={() => toggleSection("price")}
        >
          <div className="space-y-2">
            {PRICE_RANGES.map((range) => {
              const active =
                filters.minPrice === range.min &&
                filters.maxPrice === range.max;
              return (
                <button
                  key={range.label}
                  id={`filter-price-${range.label.replace(/\s+/g, "-")}`}
                  onClick={() =>
                    setFilters({
                      minPrice: active ? undefined : range.min,
                      maxPrice: active ? undefined : range.max,
                    })
                  }
                  className={[
                    "w-full rounded-xl border px-4 py-2.5 text-left text-sm transition-all duration-150",
                    active
                      ? "border-brand-400 bg-brand-50 text-brand-700 font-medium"
                      : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {range.label}
                </button>
              );
            })}
          </div>
        </FilterSection>

        {/* BHK */}
        <FilterSection
          title="Bedrooms (BHK)"
          expanded={expandedSections.bhk}
          onToggle={() => toggleSection("bhk")}
        >
          <div className="flex flex-wrap gap-2">
            {BHK_OPTIONS.map((bhk) => (
              <button
                key={bhk}
                id={`filter-bhk-${bhk}`}
                onClick={() =>
                  setFilters({
                    minBedrooms: filters.minBedrooms === bhk ? undefined : bhk,
                    maxBedrooms: filters.maxBedrooms === bhk ? undefined : bhk,
                  })
                }
                className={[
                  "flex h-10 w-14 items-center justify-center rounded-xl border text-sm font-medium transition-all duration-150",
                  filters.minBedrooms === bhk
                    ? "border-brand-400 bg-brand-50 text-brand-700"
                    : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                ].join(" ")}
              >
                {bhk} BHK
              </button>
            ))}
            <button
              id="filter-bhk-5plus"
              onClick={() =>
                setFilters({
                  minBedrooms: filters.minBedrooms === 5 ? undefined : 5,
                  maxBedrooms: undefined,
                })
              }
              className={[
                "flex h-10 w-16 items-center justify-center rounded-xl border text-sm font-medium transition-all duration-150",
                filters.minBedrooms === 5 && !filters.maxBedrooms
                  ? "border-brand-400 bg-brand-50 text-brand-700"
                  : "border-slate-200 text-slate-700 hover:border-slate-300",
              ].join(" ")}
            >
              5+ BHK
            </button>
          </div>
        </FilterSection>

        {/* Property Type */}
        <FilterSection
          title="Property Type"
          expanded={expandedSections.type}
          onToggle={() => toggleSection("type")}
        >
          <div className="space-y-2">
            {PROPERTY_TYPES.map((type) => (
              <label
                key={type.value}
                className="flex cursor-pointer items-center gap-3"
                htmlFor={`filter-type-${type.value}`}
              >
                <input
                  id={`filter-type-${type.value}`}
                  type="checkbox"
                  checked={filters.propertyType === type.value}
                  onChange={() =>
                    setFilters({
                      propertyType:
                        filters.propertyType === type.value ? undefined : type.value,
                    })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-400"
                />
                <span className="text-sm text-slate-700">{type.label}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Furnishing */}
        <FilterSection
          title="Furnishing Status"
          expanded={expandedSections.furnishing}
          onToggle={() => toggleSection("furnishing")}
        >
          <div className="flex flex-wrap gap-2">
            {(["unfurnished", "semi_furnished", "fully_furnished"] as FurnishingStatus[]).map((f) => (
              <button
                key={f}
                id={`filter-furnishing-${f}`}
                onClick={() => setFilters({ furnishingStatus: filters.furnishingStatus === f ? undefined : f })}
                className={[
                  "rounded-xl border px-4 py-2 text-sm transition-all duration-150",
                  filters.furnishingStatus === f
                    ? "border-brand-400 bg-brand-50 text-brand-700 font-medium"
                    : "border-slate-200 text-slate-700 hover:border-slate-300",
                ].join(" ")}
              >
                {f.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Possession */}
        <FilterSection
          title="Possession Status"
          expanded={expandedSections.possession}
          onToggle={() => toggleSection("possession")}
        >
          <div className="space-y-2">
            {(["ready_to_move", "under_construction", "new_launch"] as PossessionStatus[]).map((p) => (
              <label key={p} className="flex cursor-pointer items-center gap-3" htmlFor={`filter-possession-${p}`}>
                <input
                  id={`filter-possession-${p}`}
                  type="radio"
                  name="possession"
                  checked={filters.possessionStatus === p}
                  onChange={() => setFilters({ possessionStatus: filters.possessionStatus === p ? undefined : p })}
                  className="h-4 w-4 border-slate-300 text-brand-500 focus:ring-brand-400"
                />
                <span className="text-sm text-slate-700 capitalize">{p.replace(/_/g, " ")}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      </div>

      {/* Apply footer */}
      <div className="border-t border-slate-100 p-4">
        <button
          id="filter-apply-btn"
          onClick={onClose}
          className="btn-brand w-full text-sm py-3"
        >
          Show Results
        </button>
      </div>
    </div>
  );
}

// ─── Collapsible filter section ───────────────────────────────────────────────

function FilterSection({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-100">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold text-slate-800">{title}</span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded && (
        <div className="px-5 pb-4 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}
