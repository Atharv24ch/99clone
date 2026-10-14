"use client";

import Link from "next/link";
import Image from "next/image";
import { Bookmark } from "lucide-react";

import type { PropertyListItem } from "@/types/property";
import {
  formatArea,
  formatListingPrice,
  listingRef,
  pricePerSqft,
  FURNISHING_LABEL,
  LISTING_TYPE_LABEL,
  POSSESSION_LABEL,
  PROPERTY_TYPE_LABEL,
  isRental,
} from "@/types/property";
import { SealMark } from "@/components/paper/Seal";
import { GuillocheRosette } from "@/components/paper/Guilloche";
import { useSavedProperties } from "@/hooks/useSavedProperties";

interface PropertyCardProps {
  property: PropertyListItem;
  /** Horizontal row layout for the list+map view. */
  layout?: "slip" | "row";
  selected?: boolean;
  onSelect?: () => void;
  className?: string;
}

export function PropertyCard({ property, layout = "slip", selected = false, onSelect, className = "" }: PropertyCardProps) {
  const { isSaved, toggle } = useSavedProperties();
  const saved = isSaved(property.id);
  const cover = property.images?.[0];
  const config = property.bedrooms ? `${property.bedrooms} BHK` : null;
  const typeLabel = PROPERTY_TYPE_LABEL[property.propertyType] ?? property.propertyType;
  const perSqft = !isRental(property.listingType) ? pricePerSqft(property.price, property.builtUpArea) : null;

  const specs = [
    config,
    property.bathrooms ? `${property.bathrooms} bath` : null,
    property.builtUpArea ? formatArea(property.builtUpArea) : null,
    property.furnishingStatus ? FURNISHING_LABEL[property.furnishingStatus] : null,
  ].filter(Boolean) as string[];

  const row = layout === "row";

  return (
    <article
      id={`listing-${property.id}`}
      onMouseEnter={onSelect}
      onFocus={onSelect}
      className={[
        "group relative flex overflow-hidden rounded-sheet border bg-paper-sheet transition-[box-shadow,border-color] duration-200",
        row ? "flex-row" : "flex-col",
        selected ? "border-seal shadow-lift" : "border-rule hover:border-stamp-light hover:shadow-lift",
        className,
      ].join(" ")}
    >
      {/* Photograph */}
      <div className={`relative shrink-0 overflow-hidden bg-paper-deep ${row ? "w-40 sm:w-52" : "aspect-[4/3] w-full"}`}>
        {cover ? (
          <Image
            src={cover.thumbnailUrl ?? cover.cdnUrl}
            alt=""
            fill
            unoptimized
            sizes={row ? "208px" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-stamp/45">
            <GuillocheRosette className="h-20 w-20" size={160} />
            <span className="field-label !text-ink-faint">Photos awaited</span>
          </div>
        )}
        <span className="absolute left-0 top-3 bg-ink/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-paper-sheet">
          {LISTING_TYPE_LABEL[property.listingType]}
        </span>
      </div>

      {/* Slip */}
      <div className={`flex min-w-0 flex-1 flex-col ${row ? "p-4" : "p-4 pt-3.5"}`}>
        <div className="flex items-center justify-between gap-3">
          <span className="font-typed text-[11px] tracking-wide text-ink-faint">{listingRef(property.id)}</span>
          {property.isVerified && <SealMark />}
        </div>

        <p className="tabular mt-2 font-display text-[26px] leading-none text-ink">
          {formatListingPrice(property.price, property.listingType)}
        </p>
        {perSqft && <p className="tabular mt-1 text-xs text-ink-soft">{perSqft}</p>}

        <h3 className="mt-2.5 line-clamp-2 text-[15px] font-semibold leading-snug text-ink">
          <Link
            href={`/property/${property.slug}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {property.title}
          </Link>
        </h3>
        <p className="mt-1 truncate text-sm text-ink-soft">
          {typeLabel} in {property.locality}, {property.city}
        </p>

        {specs.length > 0 && (
          <p className="tabular mt-3 border-t border-dashed border-rule pt-2.5 text-[13px] text-ink-soft">
            {specs.join("  ·  ")}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-3 text-xs text-ink-faint">
          <span>
            {property.possessionStatus ? POSSESSION_LABEL[property.possessionStatus] : ""}
            {property.possessionStatus && property.listedAt ? " · " : ""}
            {property.listedAt
              ? `Listed ${new Date(property.listedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
              : ""}
          </span>
          <button
            type="button"
            onClick={() => toggle(property.id)}
            aria-pressed={saved}
            aria-label={saved ? "Remove from saved" : "Save listing"}
            className={`relative z-10 -m-1.5 rounded-sheet p-1.5 transition-colors hover:bg-paper-deep ${saved ? "text-seal" : "text-ink-faint hover:text-ink"}`}
          >
            <Bookmark className="h-[18px] w-[18px]" strokeWidth={1.75} fill={saved ? "currentColor" : "none"} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}

export function PropertyCardSkeleton({ layout = "slip" }: { layout?: "slip" | "row" }) {
  return (
    <div className={`flex overflow-hidden rounded-sheet border border-rule bg-paper-sheet ${layout === "row" ? "flex-row" : "flex-col"}`} aria-hidden="true">
      <div className={`skeleton !rounded-none ${layout === "row" ? "h-40 w-40 sm:w-52" : "aspect-[4/3] w-full"}`} />
      <div className="flex-1 space-y-3 p-4">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-7 w-32" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-2/3" />
      </div>
    </div>
  );
}
