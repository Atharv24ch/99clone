import type {
  FurnishingStatus,
  ListingType,
  PossessionStatus,
  PropertyFilters,
  PropertyType,
} from "@/types/property";

const NUMERIC_KEYS = ["minPrice", "maxPrice", "minBedrooms", "maxBedrooms"] as const;
export const COUNTED_KEYS = [
  "propertyType", "city", "locality", "minPrice", "maxPrice",
  "minBedrooms", "maxBedrooms", "furnishingStatus", "possessionStatus", "verifiedOnly",
] as const;

/** Parse URL search params into typed filters. The URL is the single source of truth. */
export function filtersFromParams(params: URLSearchParams): PropertyFilters {
  const f: PropertyFilters = {};
  const str = (k: string) => params.get(k) || undefined;

  f.listingType = str("listingType") as ListingType | undefined;
  f.propertyType = str("propertyType") as PropertyType | undefined;
  f.city = str("city");
  f.locality = str("locality") ?? str("q");
  f.furnishingStatus = str("furnishingStatus") as FurnishingStatus | undefined;
  f.possessionStatus = str("possessionStatus") as PossessionStatus | undefined;
  f.verifiedOnly = params.get("verifiedOnly") === "true" || undefined;
  f.sortBy = (str("sortBy") as PropertyFilters["sortBy"]) ?? "newest";
  for (const key of NUMERIC_KEYS) {
    const v = params.get(key);
    if (v !== null && v !== "" && Number.isFinite(Number(v))) f[key] = Number(v);
  }
  return f;
}
