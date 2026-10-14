import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";

import { propertiesService } from "@/services/properties";
import { ApiError } from "@/services/api";
import {
  formatArea,
  formatListingPrice,
  formatPrice,
  isRental,
  listingRef,
  pricePerSqft,
  rupeesInWords,
  FURNISHING_LABEL,
  LISTING_TYPE_LABEL,
  POSSESSION_LABEL,
  PROPERTY_TYPE_LABEL,
} from "@/types/property";
import type { Property } from "@/types/property";
import { PropertyGallery } from "@/components/property/PropertyGallery";
import { LeadForm } from "@/components/forms/LeadForm";
import { SaveButton } from "@/components/property/SaveButton";
import { GuillocheBand, GuillocheRosette } from "@/components/paper/Guilloche";
import { Seal } from "@/components/paper/Seal";

type Params = Promise<{ slug: string }>;

async function load(slug: string): Promise<Property | null> {
  try {
    return (await propertiesService.getBySlug(slug)).data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const property = await load(slug).catch(() => null);
  if (!property) return { title: "Listing not found" };

  const price = formatListingPrice(property.price, property.listingType);
  const description =
    property.description?.slice(0, 160) ??
    `${property.bedrooms ? `${property.bedrooms} BHK ` : ""}${PROPERTY_TYPE_LABEL[property.propertyType]} ${LISTING_TYPE_LABEL[property.listingType].toLowerCase()} in ${property.locality}, ${property.city} at ${price}.`;

  return {
    title: `${property.title}, ${price}`,
    description,
    openGraph: {
      title: property.title,
      description: `${price} · ${property.locality}, ${property.city}`,
      images: property.images?.[0] ? [{ url: property.images[0].cdnUrl }] : [],
    },
  };
}

const FACING_LABEL: Record<string, string> = {
  north: "North", south: "South", east: "East", west: "West",
  north_east: "North-east", north_west: "North-west", south_east: "South-east", south_west: "South-west",
};

export default async function PropertyDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const property = await load(slug);
  if (!property) notFound();

  const rental = isRental(property.listingType);
  const perSqft = !rental ? pricePerSqft(property.price, property.builtUpArea) : null;

  const schedule: Array<[string, string]> = (
    [
      ["Configuration", property.bedrooms ? `${property.bedrooms} BHK` : null],
      ["Property type", PROPERTY_TYPE_LABEL[property.propertyType]],
      ["Bathrooms", property.bathrooms != null ? String(property.bathrooms) : null],
      ["Balconies", property.balconies != null ? String(property.balconies) : null],
      ["Built-up area", property.builtUpArea ? formatArea(property.builtUpArea) : null],
      ["Carpet area", property.carpetArea ? formatArea(property.carpetArea) : null],
      ["Plot area", property.plotArea ? formatArea(property.plotArea) : null],
      ["Floor", property.floorNumber != null ? `${property.floorNumber}${property.totalFloors ? ` of ${property.totalFloors}` : ""}` : null],
      ["Facing", property.facing ? FACING_LABEL[property.facing] ?? property.facing : null],
      ["Furnishing", property.furnishingStatus ? FURNISHING_LABEL[property.furnishingStatus] : null],
      ["Possession", property.possessionStatus ? POSSESSION_LABEL[property.possessionStatus] : null],
      ["Age", property.ageOfProperty != null ? `${property.ageOfProperty} ${property.ageOfProperty === 1 ? "year" : "years"}` : null],
    ] as Array<[string, string | null]>
  ).filter((r): r is [string, string] => !!r[1]);

  const listed = property.listedAt
    ? new Date(property.listedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="pb-20">
      <div className="container-app pt-6">
        <nav aria-label="Breadcrumb" className="text-sm text-ink-soft">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <li><Link href="/" className="hover:text-ink hover:underline">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href={`/search?locality=${encodeURIComponent(property.city)}`} className="hover:text-ink hover:underline">{property.city}</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href={`/search?locality=${encodeURIComponent(property.locality)}`} className="hover:text-ink hover:underline">{property.locality}</Link></li>
          </ol>
        </nav>

        <div className="mt-5">
          <PropertyGallery images={property.images ?? []} title={property.title} />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
          {/* The deed */}
          <article className="sheet relative overflow-hidden">
            <GuillocheBand className="h-5 w-full text-stamp/35" height={20} />
            <GuillocheRosette className="pointer-events-none absolute -right-20 top-6 h-64 w-64 text-stamp/[0.08]" size={256} />

            <div className="relative px-6 pb-8 pt-6 sm:px-10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="field-label">{LISTING_TYPE_LABEL[property.listingType]}</span>
                <span className="font-typed text-xs tracking-wide text-ink-faint">Regd. {listingRef(property.id)}</span>
              </div>

              <h1 className="mt-4 max-w-[28ch] font-display text-[34px] leading-[1.05] text-ink sm:text-[44px]">
                {property.title}
              </h1>
              <p className="mt-3 flex items-start gap-2 text-[15px] text-ink-soft">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-stamp" strokeWidth={1.75} aria-hidden="true" />
                <span>{property.address}, {property.locality}, {property.city}{property.pincode ? ` ${property.pincode}` : ""}</span>
              </p>

              {/* Denomination */}
              <div className="relative mt-8 flex flex-wrap items-end justify-between gap-6 border-y-[3px] border-double border-stamp/50 py-5">
                <div>
                  <p className="tabular font-display text-[48px] leading-none text-ink sm:text-[56px]">
                    {formatPrice(property.price)}
                    {rental && <span className="ml-1 font-sans text-xl text-ink-soft">/month</span>}
                  </p>
                  <p className="mt-2 font-typed text-[13px] capitalize text-ink-soft">{rupeesInWords(property.price)}</p>
                </div>
                <div className="tabular text-right text-sm text-ink-soft">
                  {perSqft && <p>{perSqft}</p>}
                  {property.isNegotiable && <p className="font-semibold text-stamp-dark">Negotiable</p>}
                </div>
                {property.isVerified && (
                  <Seal className="absolute -top-11 right-0 h-[84px] w-[84px] sm:-top-14 sm:right-6 sm:h-[108px] sm:w-[108px]" size={108} center="Verified" sub="LISTING" title="Verified listing" />
                )}
              </div>

              {/* Schedule */}
              {schedule.length > 0 && (
                <section className="mt-8">
                  <h2 className="font-display text-2xl text-ink">Schedule of the property</h2>
                  <dl className="mt-4 grid border-t border-ink/60 sm:grid-cols-2 sm:gap-x-10">
                    {schedule.map(([label, value]) => (
                      <div key={label} className="flex items-baseline justify-between gap-4 border-b border-rule py-3">
                        <dt className="text-sm text-ink-soft">{label}</dt>
                        <dd className="tabular text-right text-[15px] font-semibold text-ink">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}

              {property.description && (
                <section className="mt-10">
                  <h2 className="font-display text-2xl text-ink">About this property</h2>
                  <p className="mt-3 max-w-[68ch] whitespace-pre-line text-[16px] leading-relaxed text-ink">{property.description}</p>
                </section>
              )}

              <footer className="mt-10 flex flex-wrap gap-x-6 gap-y-1 border-t border-rule pt-4 text-xs text-ink-faint">
                {listed && <span>Listed on {listed}</span>}
                <span className="tabular">{property.viewCount.toLocaleString("en-IN")} {property.viewCount === 1 ? "view" : "views"}</span>
                <span className="tabular">{property.leadCount.toLocaleString("en-IN")} {property.leadCount === 1 ? "enquiry" : "enquiries"}</span>
              </footer>
            </div>
          </article>

          {/* Contact */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="sheet p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl text-ink">Contact the lister</h2>
                  <p className="mt-1 text-sm text-ink-soft">They get your name and number right away.</p>
                </div>
                <SaveButton propertyId={property.id} />
              </div>
              <div className="mt-5">
                <LeadForm propertyId={property.id} propertyTitle={property.title} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
