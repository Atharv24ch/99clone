import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin, BedDouble, Bath, Maximize2, Shield, Star, Zap,
} from "lucide-react";
import type { PropertyListItem } from "@/types/property";
import { formatPrice, formatArea } from "@/types/property";

interface PropertyCardProps {
  property: PropertyListItem;
  compact?: boolean;
  className?: string;
  onClick?: () => void;
}

export function PropertyCard({ property, compact = false, className = "" }: PropertyCardProps) {
  const coverImage = property.images?.[0];
  const bhkLabel = property.bedrooms
    ? `${property.bedrooms} BHK`
    : property.propertyType === "plot"
    ? "Plot"
    : property.propertyType.replace(/_/g, " ");

  const possessionLabel = property.possessionStatus === "ready_to_move"
    ? "Ready to Move"
    : property.possessionStatus === "under_construction"
    ? "Under Construction"
    : property.possessionStatus === "new_launch"
    ? "New Launch"
    : null;

  return (
    <Link
      href={`/property/${property.slug}`}
      className={[
        "group block rounded-2xl border border-slate-100 bg-white overflow-hidden",
        "shadow-card hover:shadow-card-hover hover:-translate-y-0.5",
        "transition-all duration-250 ease-out cursor-pointer",
        className,
      ].join(" ")}
      aria-label={`${property.title} - ${formatPrice(property.price)}`}
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-slate-100" style={{ aspectRatio: "16/10" }}>
        {coverImage ? (
          <Image
            src={coverImage.thumbnailUrl ?? coverImage.cdnUrl}
            alt={property.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-slate-400">
              <Maximize2 className="mx-auto h-8 w-8 mb-1 opacity-30" />
              <p className="text-xs">No photo</p>
            </div>
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {property.isFeatured && (
            <span className="flex items-center gap-1 rounded-lg bg-brand-500 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
              <Star className="h-3 w-3 fill-white" /> Featured
            </span>
          )}
          {property.isVerified && (
            <span className="flex items-center gap-1 rounded-lg bg-emerald-500 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
              <Shield className="h-3 w-3 fill-white stroke-none" /> Verified
            </span>
          )}
          {possessionLabel && (
            <span className="rounded-lg bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
              {possessionLabel}
            </span>
          )}
        </div>

        {/* Listing type tag */}
        <div className="absolute right-3 top-3">
          <span className="rounded-lg bg-white/90 px-2 py-0.5 text-xs font-semibold text-slate-700 capitalize backdrop-blur-sm">
            {property.listingType === "buy" ? "Sale" : property.listingType === "rent" ? "Rent" : property.listingType.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className={compact ? "p-3" : "p-4"}>
        {/* Price */}
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-display text-xl font-bold text-slate-900">
            {formatPrice(property.price)}
          </p>
          {property.builtUpArea && (
            <p className="text-xs text-slate-400 flex-shrink-0">
              ₹{Math.round(Number(property.price) / Number(property.builtUpArea)).toLocaleString("en-IN")}/sqft
            </p>
          )}
        </div>

        {/* Title */}
        <h3 className="mt-1 text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">
          {property.title}
        </h3>

        {/* Location */}
        <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-brand-400" />
          {property.locality}, {property.city}
        </p>

        {/* Config chips */}
        <div className="mt-3 flex items-center gap-2">
          {property.bedrooms !== null && (
            <span className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              <BedDouble className="h-3.5 w-3.5 text-slate-500" />
              {property.bedrooms} BHK
            </span>
          )}
          {property.bathrooms !== null && (
            <span className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              <Bath className="h-3.5 w-3.5 text-slate-500" />
              {property.bathrooms}
            </span>
          )}
          {property.builtUpArea && (
            <span className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              <Maximize2 className="h-3.5 w-3.5 text-slate-500" />
              {formatArea(property.builtUpArea)}
            </span>
          )}
          {property.furnishingStatus && (
            <span className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hidden lg:flex">
              <Zap className="h-3.5 w-3.5 text-slate-500" />
              {property.furnishingStatus.replace(/_/g, " ")}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-3">
          <p className="text-xs text-slate-400">
            {property.listedAt
              ? `Listed ${new Date(property.listedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
              : "Just listed"}
          </p>
          <span className="text-xs font-medium text-brand-500 group-hover:underline">
            View Details →
          </span>
        </div>
      </div>
    </Link>
  );
}
