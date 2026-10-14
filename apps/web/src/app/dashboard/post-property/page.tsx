import type { Metadata } from "next";

import { PostPropertyForm } from "@/components/forms/PostPropertyForm";
import { PageTitle } from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  title: "Post a property",
  description: "List a flat, house, plot or office for sale or rent on Aangan.",
};

export default function PostPropertyPage() {
  return (
    <>
      <PageTitle title="Post a property" />
      <PostPropertyForm />
    </>
  );
}
