import type { Metadata } from "next";
import { Suspense } from "react";

import { SearchResults } from "./SearchResults";
import { filtersFromParams } from "@/lib/filters";
import { LISTING_TYPE_LABEL, PROPERTY_TYPE_LABEL } from "@/types/property";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const raw = await searchParams;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(raw)) if (typeof v === "string") params.set(k, v);
  const f = filtersFromParams(params);

  const what = f.propertyType ? `${PROPERTY_TYPE_LABEL[f.propertyType] ?? "Properties"}s` : "Properties";
  const how = f.listingType && LISTING_TYPE_LABEL[f.listingType] ? ` ${LISTING_TYPE_LABEL[f.listingType].toLowerCase()}` : "";
  const where = f.locality ? ` in ${f.locality}` : f.city ? ` in ${f.city}` : " across India";

  return {
    title: `${what}${how}${where}`,
    description: `Browse ${what.toLowerCase()}${how}${where}. Filter by budget, BHK and furnishing, and contact the owner or agent directly.`,
  };
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-64px)]" />}>
      <SearchResults />
    </Suspense>
  );
}
