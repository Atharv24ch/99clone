import type { Metadata } from "next";
import { DashboardContent } from "./DashboardContent";

export const metadata: Metadata = {
  title: "Dashboard | 99acres Clone",
  description: "Manage your property listings, leads, and profile settings.",
};

export default function DashboardPage() {
  return <DashboardContent />;
}
