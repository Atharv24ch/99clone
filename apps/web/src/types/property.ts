// ─── Property types ───────────────────────────────────────────────────────────

export type ListingType =
  | "buy"
  | "rent"
  | "pg"
  | "commercial_buy"
  | "commercial_rent"
  | "plot_buy"
  | "plot_rent"
  | "new_project";

export type PropertyType =
  | "apartment"
  | "independent_house"
  | "villa"
  | "plot"
  | "commercial_office"
  | "commercial_shop"
  | "warehouse"
  | "pg_hostel"
  | "farmhouse";

export type FurnishingStatus = "unfurnished" | "semi_furnished" | "fully_furnished";
export type PossessionStatus = "ready_to_move" | "under_construction" | "new_launch";
export type PropertyStatus = "draft" | "active" | "pending_approval" | "rejected" | "sold" | "rented" | "archived";
export type Facing = "north" | "south" | "east" | "west" | "north_east" | "north_west" | "south_east" | "south_west";

export interface PropertyImage {
  id: string;
  s3Key?: string;
  cdnUrl: string;
  thumbnailUrl: string | null;
  width?: number | null;
  height?: number | null;
  isCoverImage: boolean;
  sortOrder: number;
  isWatermarked?: boolean;
}

export interface Property {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  listingType: ListingType;
  propertyType: PropertyType;
  ownerId: string;
  projectId: string | null;
  price: string; // Decimal stored as string
  pricePerSqFt: string | null;
  isNegotiable: boolean;
  builtUpArea: string | null;
  carpetArea: string | null;
  plotArea: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  balconies: number | null;
  floorNumber: number | null;
  totalFloors: number | null;
  parkingCovered: number | null;
  parkingOpen: number | null;
  status: PropertyStatus;
  furnishingStatus: FurnishingStatus | null;
  possessionStatus: PossessionStatus | null;
  possessionDate: string | null;
  facing: Facing | null;
  ageOfProperty: number | null;
  address: string;
  locality: string;
  city: string;
  state: string;
  pincode: string | null;
  latitude: string | null;
  longitude: string | null;
  isVerified: boolean;
  isFeatured: boolean;
  isPremium: boolean;
  viewCount: number;
  leadCount: number;
  listedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined
  images?: PropertyImage[];
}

export interface PropertyListItem {
  id: string;
  status?: PropertyStatus;
  viewCount?: number;
  leadCount?: number;
  createdAt?: string;
  savedAt?: string;
  slug: string;
  title: string;
  listingType: ListingType;
  propertyType: PropertyType;
  price: string;
  bedrooms: number | null;
  bathrooms: number | null;
  builtUpArea: string | null;
  locality: string;
  city: string;
  latitude: string | null;
  longitude: string | null;
  isVerified: boolean;
  isFeatured: boolean;
  furnishingStatus: FurnishingStatus | null;
  possessionStatus: PossessionStatus | null;
  listedAt: string | null;
  // Joined
  images?: PropertyImage[];
}

// ─── Filter types ─────────────────────────────────────────────────────────────

export interface PropertyFilters {
  listingType?: ListingType;
  propertyType?: PropertyType;
  city?: string;
  locality?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  furnishingStatus?: FurnishingStatus;
  possessionStatus?: PossessionStatus;
  verifiedOnly?: boolean;
  sortBy?: "price_asc" | "price_desc" | "newest" | "popular";
  page?: number;
  limit?: number;
}

// ─── API response shapes ──────────────────────────────────────────────────────

export interface PaginatedPropertyResponse {
  data: PropertyListItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ─── Locality types ───────────────────────────────────────────────────────────

export interface LocalitySuggestion {
  id?: string;
  label: string;
  type: "locality" | "city";
  count?: number;
  latitude?: string | null;
  longitude?: string | null;
}

// ─── Inputs and aggregates ────────────────────────────────────────────────────

export interface NewPropertyInput {
  title: string;
  description?: string;
  listingType: ListingType;
  propertyType: PropertyType;
  price: number;
  isNegotiable?: boolean;
  bedrooms?: number;
  bathrooms?: number;
  balconies?: number;
  builtUpArea?: number;
  carpetArea?: number;
  plotArea?: number;
  address: string;
  locality: string;
  city: string;
  state: string;
  pincode?: string;
  furnishingStatus?: FurnishingStatus;
  possessionStatus?: PossessionStatus;
  floorNumber?: number;
  totalFloors?: number;
  ageOfProperty?: number;
  facing?: Facing;
}

export interface MarketStats {
  activeListings: number;
  verifiedListings: number;
  cities: number;
  byCity: Array<{ city: string; count: number }>;
}

// ─── Labels ───────────────────────────────────────────────────────────────────

export const LISTING_TYPE_LABEL: Record<ListingType, string> = {
  buy: "For sale",
  rent: "For rent",
  pg: "PG / Co-living",
  commercial_buy: "Commercial sale",
  commercial_rent: "Commercial rent",
  plot_buy: "Plot for sale",
  plot_rent: "Plot on lease",
  new_project: "New project",
};

export const PROPERTY_TYPE_LABEL: Record<PropertyType, string> = {
  apartment: "Apartment",
  independent_house: "Independent house",
  villa: "Villa",
  plot: "Plot",
  commercial_office: "Office space",
  commercial_shop: "Shop",
  warehouse: "Warehouse",
  pg_hostel: "PG / Hostel",
  farmhouse: "Farmhouse",
};

export const FURNISHING_LABEL: Record<FurnishingStatus, string> = {
  unfurnished: "Unfurnished",
  semi_furnished: "Semi-furnished",
  fully_furnished: "Fully furnished",
};

export const POSSESSION_LABEL: Record<PossessionStatus, string> = {
  ready_to_move: "Ready to move",
  under_construction: "Under construction",
  new_launch: "New launch",
};

export const STATUS_LABEL: Record<PropertyStatus, string> = {
  draft: "Draft",
  active: "Live",
  pending_approval: "In review",
  rejected: "Rejected",
  sold: "Sold",
  rented: "Rented",
  archived: "Archived",
};

export function isRental(listingType: ListingType): boolean {
  return listingType === "rent" || listingType === "pg" || listingType === "commercial_rent" || listingType === "plot_rent";
}

/** Short registration-style reference derived from the listing id. */
export function listingRef(id: string): string {
  return `AAN-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

// ─── Format helpers ───────────────────────────────────────────────────────────

function trimZeros(n: number, digits = 2): string {
  return n.toFixed(digits).replace(/\.?0+$/, "");
}

export function formatPrice(price: string | number): string {
  const num = Number(price);
  if (!Number.isFinite(num)) return "Price on request";
  if (num >= 10_000_000) return `₹${trimZeros(num / 10_000_000)} Cr`;
  if (num >= 100_000) return `₹${trimZeros(num / 100_000)} L`;
  return `₹${Math.round(num).toLocaleString("en-IN")}`;
}

/** Price with a per-month suffix for rentals. */
export function formatListingPrice(price: string | number, listingType: ListingType): string {
  return isRental(listingType) ? `${formatPrice(price)}/mo` : formatPrice(price);
}

export function pricePerSqft(price: string | number, area: string | number | null): string | null {
  const a = Number(area);
  const p = Number(price);
  if (!a || !p) return null;
  return `₹${Math.round(p / a).toLocaleString("en-IN")}/sq.ft`;
}

const ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve",
  "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function below100(n: number): string {
  if (n < 20) return ONES[n] ?? "";
  const t = TENS[Math.floor(n / 10)] ?? "";
  const o = ONES[n % 10] ?? "";
  return o ? `${t}-${o}` : t;
}

function below1000(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return [h ? `${ONES[h]} hundred` : "", r ? below100(r) : ""].filter(Boolean).join(" ");
}

/**
 * Rupees in words using the Indian system (lakh, crore), as written on
 * stamp paper and cheques: "Rupees one crore twenty lakh only".
 */
export function rupeesInWords(price: string | number): string {
  let n = Math.round(Number(price));
  if (!Number.isFinite(n) || n <= 0) return "";
  const crore = Math.floor(n / 10_000_000); n %= 10_000_000;
  const lakh = Math.floor(n / 100_000); n %= 100_000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  const parts = [
    crore ? `${crore >= 100 ? below1000(crore) : below100(crore)} crore` : "",
    lakh ? `${below100(lakh)} lakh` : "",
    thousand ? `${below100(thousand)} thousand` : "",
    n ? below1000(n) : "",
  ].filter(Boolean);
  const words = parts.join(" ");
  return `Rupees ${words} only`;
}

export function formatArea(area: string | number | null): string {
  if (!area) return "N/A";
  return `${Number(area).toLocaleString("en-IN")} sq.ft`;
}
