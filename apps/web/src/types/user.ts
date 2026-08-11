export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string | null;
  avatarUrl: string | null;
  role: "buyer" | "seller" | "agent" | "builder" | "admin";
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  reraNumber: string | null;
  agencyName: string | null;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
