export type UserRole = "buyer" | "seller" | "agent" | "builder" | "admin";

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  reraNumber: string | null;
  agencyName: string | null;
  bio?: string | null;
  createdAt: string;
}

export type LeadStatus = "new" | "contacted" | "visited" | "negotiating" | "converted" | "lost" | "spam";

export interface Lead {
  id: string;
  propertyId: string;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  status: LeadStatus;
  source: string;
  notes: string | null;
  createdAt: string;
  firstContactAt: string | null;
  propertyTitle: string;
  propertySlug: string;
  propertyLocality: string;
  propertyCity: string;
}

export interface DashboardStats {
  activeListings: number;
  pendingListings: number;
  totalListings: number;
  totalViews: number;
  totalLeads: number;
  newLeads: number;
  savedProperties: number;
}
