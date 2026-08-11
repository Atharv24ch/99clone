import type { Metadata } from "next";
import React from "react";
import { notFound } from "next/navigation";
import {
  MapPin, BedDouble, Bath, Maximize2, Layers, Calendar,
  Shield, Star, Zap, Clock, Eye, Phone, MessageSquare,
} from "lucide-react";
import { propertiesService } from "@/services/properties";
import { formatPrice, formatArea } from "@/types/property";
import { PropertyGallery } from "@/components/property/PropertyGallery";
import { LeadForm } from "@/components/forms/LeadForm";

// ─── SEO metadata ─────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const { data: property } = await propertiesService.getBySlug(slug);
    return {
      title: `${property.title} | ${formatPrice(property.price)} in ${property.locality}, ${property.city}`,
      description:
        property.description ??
        `${property.bedrooms ?? ""} BHK ${property.propertyType.replace(/_/g, " ")} for ${property.listingType} in ${property.locality}, ${property.city}. Listed at ${formatPrice(property.price)}.`,
      openGraph: {
        title: property.title,
        description: `${formatPrice(property.price)} | ${property.locality}, ${property.city}`,
        images: property.images?.[0] ? [{ url: property.images[0].cdnUrl }] : [],
        type: "website",
      },
    };
  } catch {
    return { title: "Property | 99acres Clone" };
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let property;
  try {
    const result = await propertiesService.getBySlug(slug);
    property = result.data;
  } catch {
    notFound();
  }

  const specs = [
    property.bedrooms !== null && { icon: BedDouble, label: "Bedrooms", value: `${property.bedrooms} BHK` },
    property.bathrooms !== null && { icon: Bath, label: "Bathrooms", value: property.bathrooms },
    property.builtUpArea && { icon: Maximize2, label: "Built-up Area", value: formatArea(property.builtUpArea) },
    property.carpetArea && { icon: Maximize2, label: "Carpet Area", value: formatArea(property.carpetArea) },
    property.floorNumber !== null && { icon: Layers, label: "Floor", value: `${property.floorNumber} of ${property.totalFloors ?? "?"}` },
    property.facing && { icon: Calendar, label: "Facing", value: property.facing.replace(/_/g, " ") },
    property.ageOfProperty !== null && { icon: Clock, label: "Age", value: `${property.ageOfProperty} year${property.ageOfProperty !== 1 ? "s" : ""}` },
    property.furnishingStatus && { icon: Zap, label: "Furnishing", value: property.furnishingStatus.replace(/_/g, " ") },
  ].filter(Boolean) as Array<{ icon: React.ElementType; label: string; value: string | number }>;

  return (
    <div className="bg-slate-50 pb-16">
      <div className="container-app pt-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-400 mb-4" aria-label="Breadcrumb">
          <a href="/" className="hover:text-slate-600">Home</a>
          <span>/</span>
          <a href={`/search?city=${property.city}`} className="hover:text-slate-600">{property.city}</a>
          <span>/</span>
          <a href={`/search?locality=${property.locality}`} className="hover:text-slate-600">{property.locality}</a>
          <span>/</span>
          <span className="text-slate-600 truncate max-w-48">{property.title}</span>
        </nav>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery */}
            <PropertyGallery
              images={property.images ?? []}
              title={property.title}
            />

            {/* Header card */}
            <div className="card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {property.isVerified && (
                      <span className="badge-verified flex items-center gap-1 text-xs">
                        <Shield className="h-3 w-3" /> Verified
                      </span>
                    )}
                    {property.isFeatured && (
                      <span className="flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                        <Star className="h-3 w-3 fill-brand-400 text-brand-400" /> Featured
                      </span>
                    )}
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 capitalize">
                      For {property.listingType === "buy" ? "Sale" : property.listingType === "rent" ? "Rent" : property.listingType.replace(/_/g, " ")}
                    </span>
                  </div>

                  <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 text-balance">
                    {property.title}
                  </h1>

                  <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                    <MapPin className="h-4 w-4 text-brand-400 flex-shrink-0" />
                    {property.address}, {property.locality}, {property.city} — {property.pincode}
                  </p>
                </div>

                {/* Price */}
                <div className="text-right">
                  <p className="font-display text-3xl font-bold text-slate-900">
                    {formatPrice(property.price)}
                  </p>
                  {property.builtUpArea && (
                    <p className="text-sm text-slate-400 mt-1">
                      ₹{Math.round(Number(property.price) / Number(property.builtUpArea)).toLocaleString("en-IN")}/sqft
                    </p>
                  )}
                  {property.isNegotiable && (
                    <span className="mt-1 inline-block rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      Negotiable
                    </span>
                  )}
                </div>
              </div>

              {/* View & lead count */}
              <div className="mt-4 flex items-center gap-4 text-xs text-slate-400 border-t border-slate-100 pt-4">
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" /> {property.viewCount.toLocaleString()} views
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" /> {property.leadCount} enquiries
                </span>
                {property.listedAt && (
                  <span>Listed {new Date(property.listedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                )}
              </div>
            </div>

            {/* Specs grid */}
            {specs.length > 0 && (
              <div className="card p-6">
                <h2 className="text-base font-semibold text-slate-900 mb-4">Property Overview</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {specs.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white border border-slate-100">
                        <Icon className="h-4 w-4 text-brand-500" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">{label}</p>
                        <p className="text-sm font-semibold text-slate-800 capitalize">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {property.description && (
              <div className="card p-6">
                <h2 className="text-base font-semibold text-slate-900 mb-3">About this Property</h2>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {property.description}
                </p>
              </div>
            )}
          </div>

          {/* Right: Lead form (sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 card p-5">
              <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Phone className="h-4 w-4 text-brand-500" />
                Contact Agent
              </h2>
              <LeadForm
                propertyId={property.id}
                propertyTitle={property.title}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
