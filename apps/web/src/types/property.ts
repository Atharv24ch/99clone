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
  s3Key: string;
  cdnUrl: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  isCoverImage: boolean;
  sortOrder: number;
  isWatermarked: boolean;
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

// ─── Format helpers ───────────────────────────────────────────────────────────

export function formatPrice(price: string | number): string {
  const num = Number(price);
  if (num >= 10_000_000) return `₹${(num / 10_000_000).toFixed(2)} Cr`;
  if (num >= 100_000) return `₹${(num / 100_000).toFixed(2)} L`;
  return `₹${num.toLocaleString("en-IN")}`;
}

export function formatArea(area: string | number | null): string {
  if (!area) return "N/A";
  return `${Number(area).toLocaleString("en-IN")} sq.ft`;
}
