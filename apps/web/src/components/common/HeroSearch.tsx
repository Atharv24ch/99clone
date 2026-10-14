"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, MapPin, Building2 } from "lucide-react";

import { propertiesService } from "@/services/properties";
import type { ListingType, LocalitySuggestion } from "@/types/property";
import { useDebounce } from "@/hooks/useDebounce";

const TABS: Array<{ id: ListingType; label: string }> = [
  { id: "buy", label: "Buy" },
  { id: "rent", label: "Rent" },
  { id: "commercial_buy", label: "Commercial" },
  { id: "pg", label: "PG" },
  { id: "plot_buy", label: "Plots" },
  { id: "new_project", label: "New projects" },
];

/**
 * HeroSearch — the working search set as clauses on the stamp-paper sheet:
 * a listing-type choice, then the locality typed onto a ruled line.
 */
export function HeroSearch() {
  const router = useRouter();
  const [listingType, setListingType] = useState<ListingType>("buy");
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<LocalitySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const debounced = useDebounce(value.trim(), 250);

  useEffect(() => {
    if (debounced.length < 2) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    propertiesService
      .suggest(debounced)
      .then((res) => {
        if (cancelled) return;
        setSuggestions(res.data);
        setHighlight(-1);
      })
      .catch(() => !cancelled && setSuggestions([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const go = (place?: string) => {
    const q = (place ?? value).trim();
    const params = new URLSearchParams({ listingType });
    if (q) params.set("locality", q);
    setOpen(false);
    router.push(`/search?${params.toString()}`);
  };

  const showList = open && (loading || suggestions.length > 0);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && suggestions.length) {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => (h + 1) % suggestions.length);
    } else if (e.key === "ArrowUp" && suggestions.length) {
      e.preventDefault();
      setHighlight((h) => (h <= 0 ? suggestions.length - 1 : h - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const picked = highlight >= 0 ? suggestions[highlight] : undefined;
        go(picked?.label);
      }}
      className="w-full"
    >
      <div className="flex flex-wrap items-baseline gap-x-1 gap-y-2">
        <span className="field-label mr-2">Looking to</span>
        <div role="radiogroup" aria-label="Listing type" className="flex flex-wrap gap-x-1 gap-y-1">
          {TABS.map((tab) => {
            const active = tab.id === listingType;
            return (
              <button
                key={tab.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setListingType(tab.id)}
                className={[
                  "relative px-2.5 py-1 text-[15px] transition-colors",
                  active ? "font-semibold text-seal-dark" : "text-ink-soft hover:text-ink",
                ].join(" ")}
              >
                {tab.label}
                <span
                  className={`absolute inset-x-2 bottom-0 h-[2px] origin-left bg-seal transition-transform duration-300 ease-out ${active ? "scale-x-100" : "scale-x-0"}`}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      </div>

      <div ref={boxRef} className="relative mt-5">
        <label htmlFor="hero-search" className="field-label">
          Locality, city or project
        </label>
        <div className="mt-1 flex items-end gap-3">
          <input
            id="hero-search"
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Baner, Pune"
            autoComplete="off"
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={highlight >= 0 ? `${listId}-${highlight}` : undefined}
            className="input-line !border-ink/50 !py-2.5 font-display !text-[26px] leading-none sm:!text-[32px]"
          />
          <button type="submit" className="btn-seal shrink-0 !px-6 !py-3">
            <Search className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
            Search
          </button>
        </div>

        {showList && (
          <ul
            id={listId}
            role="listbox"
            className="sheet absolute left-0 right-0 top-full z-30 mt-2 max-h-80 overflow-y-auto py-1.5 sm:right-28"
          >
            {loading && suggestions.length === 0 && (
              <li className="flex items-center gap-2 px-4 py-3 text-sm text-ink-soft">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Looking up places
              </li>
            )}
            {suggestions.map((s, i) => {
              const Icon = s.type === "city" ? Building2 : MapPin;
              return (
                <li
                  key={`${s.type}-${s.label}`}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === highlight}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setValue(s.label);
                    go(s.label);
                  }}
                  onMouseEnter={() => setHighlight(i)}
                  className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 text-[15px] ${i === highlight ? "bg-seal-wash" : ""}`}
                >
                  <Icon className="h-4 w-4 shrink-0 text-ink-faint" strokeWidth={1.75} aria-hidden="true" />
                  <span className="flex-1 truncate text-ink">{s.label}</span>
                  <span className="text-xs capitalize text-ink-faint">{s.type}</span>
                  {s.count ? <span className="tabular w-10 text-right text-xs text-ink-soft">{s.count}</span> : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </form>
  );
}
