"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, X, Loader2, ChevronRight } from "lucide-react";
import { useFilterStore } from "@/store/filterStore";
import { propertiesService } from "@/services/properties";
import type { LocalitySuggestion } from "@/types/property";
import { useDebounce } from "@/hooks/useDebounce";

const LISTING_TABS = [
  { id: "buy", label: "Buy" },
  { id: "rent", label: "Rent" },
  { id: "commercial", label: "Commercial" },
  { id: "pg", label: "PG / Co-living" },
  { id: "plot", label: "Plot / Land" },
  { id: "projects", label: "New Projects" },
] as const;

export function HeroSearch() {
  const router = useRouter();
  const { activeTab, setActiveTab, setSearchQuery, setSelectedLocality } = useFilterStore();
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<LocalitySuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(inputValue, 280);

  // Fetch suggestions
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    propertiesService
      .suggest(debouncedQuery)
      .then((res) => {
        setSuggestions(res.data);
        setShowDropdown(true);
      })
      .catch(() => setSuggestions([]))
      .finally(() => setIsLoading(false));
  }, [debouncedQuery]);

  // Click outside to close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearch = useCallback(
    (locality?: string) => {
      const searchLocality = locality ?? inputValue;
      setSearchQuery(searchLocality);
      if (searchLocality) setSelectedLocality(searchLocality);
      setShowDropdown(false);

      const params = new URLSearchParams();
      params.set("listingType", activeTab === "commercial" ? "commercial_buy" : activeTab === "projects" ? "new_project" : activeTab);
      if (searchLocality) params.set("locality", searchLocality);
      router.push(`/search?${params.toString()}`);
    },
    [inputValue, activeTab, setSearchQuery, setSelectedLocality, router]
  );

  return (
    <div className="w-full max-w-4xl mx-auto">

      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0">
        {LISTING_TABS.map((tab) => (
          <button
            key={tab.id}
            id={`hero-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={[
              "relative flex-shrink-0 rounded-t-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200",
              activeTab === tab.id
                ? "bg-white/20 backdrop-blur-md text-white border border-white/30 border-b-transparent shadow-lg"
                : "text-white/60 hover:text-white hover:bg-white/10",
            ].join(" ")}
          >
            {tab.label}
            {/* Active indicator glow */}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-orange-400" />
            )}
          </button>
        ))}
      </div>

      {/* ── Search body ─────────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative rounded-b-2xl rounded-tr-2xl p-1.5"
        style={{
          background: "rgba(255,255,255,0.12)",
          backdropFilter: "blur(24px) saturate(150%)",
          WebkitBackdropFilter: "blur(24px) saturate(150%)",
          border: "1px solid rgba(255,255,255,0.18)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.12)",
        }}
      >
        <div className="flex items-center gap-2">

          {/* Location pin + Input */}
          <div className="relative flex-1">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-400/80 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              id="hero-search-input"
              value={inputValue}
              onChange={(e) => { setInputValue(e.target.value); setShowDropdown(true); }}
              onFocus={() => inputValue.length >= 2 && setShowDropdown(true)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search for locality, landmark, project..."
              className="w-full rounded-xl pl-11 pr-10 py-3.5 text-sm font-medium text-white placeholder:text-white/40 transition-all duration-200 outline-none focus:ring-[3px] focus:ring-orange-500/15"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
              autoComplete="off"
            />
            {inputValue && (
              <button
                onClick={() => { setInputValue(""); setSuggestions([]); inputRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* ── Suggestions dropdown ──────────────────────────────────────── */}
            {showDropdown && (suggestions.length > 0 || isLoading) && (
              <div
                className="absolute left-0 top-full mt-2 z-50 w-full rounded-2xl py-2 animate-slide-down"
                style={{
                  background: "rgba(15,23,42,0.90)",
                  backdropFilter: "blur(24px) saturate(160%)",
                  WebkitBackdropFilter: "blur(24px) saturate(160%)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow: "0 12px 48px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.06)",
                }}
              >
                {isLoading && (
                  <div className="flex items-center gap-2 px-4 py-3 text-sm text-white/50">
                    <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
                    Searching...
                  </div>
                )}
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    id={`suggestion-${i}`}
                    onClick={() => { setInputValue(s.label); handleSearch(s.label); }}
                    className="group flex w-full items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors hover:bg-white/8 rounded-lg mx-1"
                    style={{ width: "calc(100% - 8px)" }}
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-orange-500/15 ring-1 ring-orange-400/20">
                      <MapPin className="h-4 w-4 text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-white">{s.label}</span>
                      <span className="ml-2 rounded-md bg-white/10 px-1.5 py-0.5 text-xs text-white/50 capitalize">
                        {s.type}
                      </span>
                    </div>
                    {s.count !== undefined && (
                      <span className="ml-auto text-xs text-white/40 flex items-center gap-1">
                        {s.count.toLocaleString()} <ChevronRight className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Search button ──────────────────────────────────────────────── */}
          <button
            id="hero-search-btn"
            onClick={() => handleSearch()}
            className="group relative flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold text-white flex-shrink-0 overflow-hidden transition-all duration-200 hover:-translate-y-px active:translate-y-0"
            style={{
              background: "linear-gradient(135deg, hsl(24,92%,51%) 0%, hsl(14,90%,48%) 100%)",
              boxShadow: "0 4px 16px rgba(249,115,22,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            {/* Hover shimmer effect */}
            <span
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: "linear-gradient(135deg, hsl(24,92%,56%) 0%, hsl(14,90%,52%) 100%)",
              }}
            />
            <Search className="h-4.5 w-4.5 relative z-10" />
            <span className="hidden sm:block relative z-10">Search</span>
          </button>
        </div>
      </div>
    </div>
  );
}
