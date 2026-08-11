import type { PropertyFilters, PaginatedPropertyResponse, Property, LocalitySuggestion } from "@/types/property";
import { apiFetch } from "./api";

/**
 * Build query string from filter object (omitting undefined values).
 */
function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      qs.set(key, String(value));
    }
  }
  return qs.toString() ? `?${qs.toString()}` : "";
}

// ─── Property API calls ───────────────────────────────────────────────────────

export const propertiesService = {
  /**
   * Fetch paginated property listings with filters.
   */
  async list(filters: PropertyFilters = {}): Promise<PaginatedPropertyResponse> {
    const query = buildQuery(filters as Record<string, string | number | boolean | undefined>);
    return apiFetch<PaginatedPropertyResponse>(`/api/v1/properties${query}`);
  },

  /**
   * Fetch a single property by UUID.
   */
  async getById(id: string): Promise<{ data: Property }> {
    return apiFetch<{ data: Property }>(`/api/v1/properties/${id}`);
  },

  /**
   * Fetch a single property by SEO slug (for SSR pages).
   */
  async getBySlug(slug: string): Promise<{ data: Property }> {
    return apiFetch<{ data: Property }>(`/api/v1/properties/slug/${slug}`);
  },

  /**
   * Search properties by radius from a coordinate (PostGIS).
   */
  async nearby(params: {
    lat: number;
    lng: number;
    radiusKm?: number;
    limit?: number;
    listingType?: string;
  }): Promise<{ data: Property[] }> {
    const query = buildQuery(params as Record<string, string | number | boolean | undefined>);
    return apiFetch<{ data: Property[] }>(`/api/v1/properties/nearby${query}`);
  },

  /**
   * Create a new listing (auth required).
   */
  async create(data: Partial<Property>, token: string): Promise<{ data: Property }> {
    return apiFetch<{ data: Property }>("/api/v1/properties", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    });
  },

  /**
   * OpenSearch full-text search.
   */
  async search(params: {
    q: string;
    city?: string;
    listingType?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedPropertyResponse> {
    const query = buildQuery(params as Record<string, string | number | boolean | undefined>);
    return apiFetch<PaginatedPropertyResponse>(`/api/v1/search${query}`);
  },

  /**
   * Locality autocomplete suggestions.
   */
  async suggest(q: string): Promise<{ data: LocalitySuggestion[] }> {
    return apiFetch<{ data: LocalitySuggestion[] }>(`/api/v1/search/suggest?q=${encodeURIComponent(q)}`);
  },

  /**
   * Get presigned S3 URL for direct browser upload.
   */
  async getPresignedUrl(params: {
    fileName: string;
    contentType: string;
    propertyId: string;
  }, token: string): Promise<{ data: { presignedUrl: string; s3Key: string; cdnUrl: string } }> {
    return apiFetch("/api/v1/upload/presign", {
      method: "POST",
      body: JSON.stringify(params),
      token,
    });
  },
};

/**
 * Submit a lead / enquiry.
 */
export async function submitLead(data: {
  propertyId: string;
  name: string;
  phone: string;
  email?: string;
  message?: string;
}): Promise<{ data: { id: string; message: string } }> {
  return apiFetch("/api/v1/leads", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
