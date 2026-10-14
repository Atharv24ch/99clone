import type {
  PropertyFilters,
  PaginatedPropertyResponse,
  Property,
  PropertyListItem,
  LocalitySuggestion,
  NewPropertyInput,
  MarketStats,
  PropertyImage,
} from "@/types/property";
import type { Lead, LeadStatus, DashboardStats, User } from "@/types/user";
import { apiFetch } from "./api";

/** Build a query string from a params object, omitting empty values. */
export function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "" && value !== false) {
      qs.set(key, String(value));
    }
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

// ─── Properties ───────────────────────────────────────────────────────────────

export const propertiesService = {
  list(filters: PropertyFilters = {}, init?: { revalidate?: number }) {
    return apiFetch<PaginatedPropertyResponse>(
      `/api/v1/properties${buildQuery(filters as Record<string, string | number | boolean | undefined>)}`,
      init
    );
  },

  stats() {
    return apiFetch<{ data: MarketStats }>("/api/v1/properties/stats", { revalidate: 300 });
  },

  getBySlug(slug: string) {
    return apiFetch<{ data: Property }>(`/api/v1/properties/slug/${encodeURIComponent(slug)}`, { cache: "no-store" });
  },

  getById(id: string, token?: string | null) {
    return apiFetch<{ data: Property }>(`/api/v1/properties/${id}`, { token });
  },

  mine(token: string) {
    return apiFetch<{ data: PropertyListItem[] }>("/api/v1/properties/mine", { token });
  },

  pending(token: string) {
    return apiFetch<{ data: PropertyListItem[] }>("/api/v1/properties/pending", { token });
  },

  saved(token: string) {
    return apiFetch<{ data: PropertyListItem[] }>("/api/v1/properties/saved", { token });
  },

  savedIds(token: string) {
    return apiFetch<{ data: string[] }>("/api/v1/properties/saved/ids", { token });
  },

  save(id: string, token: string) {
    return apiFetch<void>(`/api/v1/properties/${id}/save`, { method: "PUT", token });
  },

  unsave(id: string, token: string) {
    return apiFetch<void>(`/api/v1/properties/${id}/save`, { method: "DELETE", token });
  },

  create(data: NewPropertyInput, token: string) {
    return apiFetch<{ data: Property }>("/api/v1/properties", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    });
  },

  update(id: string, data: Partial<NewPropertyInput>, token: string) {
    return apiFetch<{ data: Property }>(`/api/v1/properties/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
      token,
    });
  },

  setStatus(id: string, body: { status: string; isVerified?: boolean; isFeatured?: boolean }, token: string) {
    return apiFetch<{ data: Property }>(`/api/v1/properties/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(body),
      token,
    });
  },

  remove(id: string, token: string) {
    return apiFetch<void>(`/api/v1/properties/${id}`, { method: "DELETE", token });
  },

  suggest(q: string) {
    return apiFetch<{ data: LocalitySuggestion[] }>(`/api/v1/search/suggest?q=${encodeURIComponent(q)}`);
  },

  /**
   * Upload one photo: presign → PUT to storage → register with the listing.
   */
  async uploadImage(propertyId: string, file: File, token: string, isCoverImage = false) {
    const presign = await apiFetch<{ data: { presignedUrl: string; s3Key: string } }>("/api/v1/upload/presign", {
      method: "POST",
      body: JSON.stringify({ fileName: file.name, contentType: file.type, propertyId }),
      token,
    });

    const put = await fetch(presign.data.presignedUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });
    if (!put.ok) throw new Error(`Upload failed for ${file.name}`);

    return apiFetch<{ data: PropertyImage }>(`/api/v1/properties/${propertyId}/images`, {
      method: "POST",
      body: JSON.stringify({ s3Key: presign.data.s3Key, mimeType: file.type, sizeBytes: file.size, isCoverImage }),
      token,
    });
  },
};

// ─── Leads ────────────────────────────────────────────────────────────────────

export function submitLead(
  data: { propertyId: string; name: string; phone: string; email?: string; message?: string },
  token?: string | null
) {
  return apiFetch<{ data: { id: string; message: string } }>("/api/v1/leads", {
    method: "POST",
    body: JSON.stringify({ ...data, email: data.email || undefined }),
    token,
  });
}

export const leadsService = {
  list(token: string, params: { status?: LeadStatus; page?: number; limit?: number } = {}) {
    return apiFetch<{ data: Lead[]; total: number; page: number; hasMore: boolean }>(
      `/api/v1/leads${buildQuery(params)}`,
      { token }
    );
  },

  setStatus(id: string, status: LeadStatus, token: string, notes?: string) {
    return apiFetch<{ data: Lead }>(`/api/v1/leads/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, notes }),
      token,
    });
  },
};

// ─── Account ──────────────────────────────────────────────────────────────────

export const accountService = {
  login(body: { email: string; password: string }) {
    return apiFetch<{ data: { user: User; token: string } }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  register(body: {
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    password: string;
    role: string;
  }) {
    return apiFetch<{ data: { user: User; token: string } }>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  me(token: string) {
    return apiFetch<{ data: User }>("/api/v1/auth/me", { token });
  },

  update(body: Partial<Pick<User, "firstName" | "lastName" | "phone" | "agencyName" | "reraNumber" | "bio">>, token: string) {
    return apiFetch<{ data: User }>("/api/v1/auth/me", {
      method: "PATCH",
      body: JSON.stringify(body),
      token,
    });
  },

  stats(token: string) {
    return apiFetch<{ data: DashboardStats }>("/api/v1/auth/me/stats", { token });
  },
};
