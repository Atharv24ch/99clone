// ─── JWT payload shape ────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;       // user UUID
  role: string;      // user role
  email?: string;
  iat?: number;
  exp?: number;
}

// ─── API response shapes ──────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

// ─── Fastify augmentation ─────────────────────────────────────────────────────

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}
