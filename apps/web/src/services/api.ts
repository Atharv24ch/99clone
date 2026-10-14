// Tolerate common misconfigurations: trailing slashes or a pasted "/api/v1" suffix
const API_BASE = (process.env["NEXT_PUBLIC_API_URL"] || "http://localhost:3002")
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/api\/v1$/, "");

type RequestOptions = RequestInit & {
  token?: string | null;
  /** Next.js fetch cache hint for server components. */
  revalidate?: number;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Called on any 401 so the app can drop a stale session. */
let unauthorizedHandler: (() => void) | null = null;
export function onUnauthorized(handler: () => void) {
  unauthorizedHandler = handler;
}

/**
 * Typed fetch wrapper for the API server.
 * Attaches the bearer token, maps error bodies to ApiError, handles 204.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, revalidate, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    ...(fetchOptions.body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(fetchOptions.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...fetchOptions,
      headers,
      ...(revalidate !== undefined ? { next: { revalidate } } : {}),
    });
  } catch {
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0, "NetworkError");
  }

  if (!response.ok) {
    let errorBody: { error?: string; message?: string } = {};
    try {
      errorBody = (await response.json()) as typeof errorBody;
    } catch {
      // non-JSON error body
    }
    if (response.status === 401 && token) unauthorizedHandler?.();
    throw new ApiError(
      errorBody.message ?? `Request failed (${response.status})`,
      response.status,
      errorBody.error ?? "Error"
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function errorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  return err instanceof ApiError ? err.message : fallback;
}
