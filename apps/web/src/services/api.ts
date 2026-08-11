const API_BASE = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3002";

type RequestOptions = RequestInit & {
  token?: string;
};

/**
 * Typed fetch wrapper for the API server.
 * Attaches Authorization header, handles errors, and returns typed JSON.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    let errorBody: { error?: string; message?: string } = {};
    try {
      errorBody = (await response.json()) as typeof errorBody;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(
      errorBody.message ?? `Request failed with status ${response.status}`,
      response.status,
      errorBody.error ?? "Unknown Error"
    );
  }

  return response.json() as Promise<T>;
}

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
