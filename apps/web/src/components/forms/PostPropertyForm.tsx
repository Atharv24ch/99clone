"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight, ChevronLeft, Home, MapPin, DollarSign,
  Image as ImageIcon, CheckCircle, Upload, X,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { propertiesService } from "@/services/properties";

type Step = "type" | "details" | "location" | "pricing" | "photos" | "review";

const STEPS: Array<{ id: Step; label: string; icon: React.ElementType }> = [
  { id: "type", label: "Property Type", icon: Home },
  { id: "details", label: "Details", icon: ChevronRight },
  { id: "location", label: "Location", icon: MapPin },
  { id: "pricing", label: "Pricing", icon: DollarSign },
  { id: "photos", label: "Photos", icon: ImageIcon },
  { id: "review", label: "Review", icon: CheckCircle },
];

const LISTING_TYPES = [
  { value: "buy", label: "Sell", icon: "🏠", desc: "List property for sale" },
  { value: "rent", label: "Rent", icon: "🔑", desc: "List property for rent" },
  { value: "pg", label: "PG/Co-living", icon: "🛏️", desc: "List a PG or hostel" },
  { value: "commercial_buy", label: "Commercial Sale", icon: "🏢", desc: "Sell commercial space" },
  { value: "commercial_rent", label: "Commercial Rent", icon: "📋", desc: "Rent commercial space" },
];

const PROPERTY_TYPES = [
  "apartment", "independent_house", "villa", "plot",
  "commercial_office", "commercial_shop", "farmhouse",
];

interface FormData {
  listingType: string;
  propertyType: string;
  title: string;
  description: string;
  bedrooms?: number;
  bathrooms?: number;
  builtUpArea?: number;
  carpetArea?: number;
  floorNumber?: number;
  totalFloors?: number;
  furnishingStatus: string;
  possessionStatus: string;
  facing: string;
  address: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  price?: number;
  isNegotiable: boolean;
}

const initialForm: FormData = {
  listingType: "",
  propertyType: "",
  title: "",
  description: "",
  furnishingStatus: "",
  possessionStatus: "",
  facing: "",
  address: "",
  locality: "",
  city: "",
  state: "",
  pincode: "",
  isNegotiable: false,
};

export function PostPropertyForm() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [currentStep, setCurrentStep] = useState<Step>("type");
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);

  const stepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const update = (key: keyof FormData, value: unknown) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => { const { [key]: _, ...rest } = e; return rest; });
  };

  const goNext = () => {
    const nextStep = STEPS[stepIndex + 1];
    if (nextStep) setCurrentStep(nextStep.id);
  };

  const goPrev = () => {
    const prevStep = STEPS[stepIndex - 1];
    if (prevStep) setCurrentStep(prevStep.id);
  };

  const handleSubmit = async () => {
    if (!token) {
      router.push("/(auth)/login");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await propertiesService.create(
        {
          title: form.title || `${form.bedrooms ?? ""} BHK ${form.propertyType} in ${form.locality}`,
          description: form.description,
          listingType: form.listingType as "buy" | "rent",
          propertyType: form.propertyType as "apartment",
          price: String(form.price ?? 0),
          bedrooms: form.bedrooms,
          bathrooms: form.bathrooms,
          builtUpArea: form.builtUpArea !== undefined ? String(form.builtUpArea) : undefined,
          address: form.address,
          locality: form.locality,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          furnishingStatus: (form.furnishingStatus || undefined) as "unfurnished" | undefined,
          possessionStatus: (form.possessionStatus || undefined) as "ready_to_move" | undefined,
        },
        token
      );
      setCreatedPropertyId(result.data.id);
      setCurrentStep("review");
    } catch {
      setErrors({ submit: "Failed to post property. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Progress stepper */}
      <div className="mb-10">
        <div className="flex items-center justify-between">
          {STEPS.map((step, i) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-1.5">
                <button
                  onClick={() => i < stepIndex && setCurrentStep(step.id)}
                  disabled={i > stepIndex}
                  className={[
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold text-sm transition-all",
                    i < stepIndex
                      ? "border-brand-500 bg-brand-500 text-white cursor-pointer"
                      : i === stepIndex
                      ? "border-brand-500 bg-white text-brand-600"
                      : "border-slate-200 bg-white text-slate-400 cursor-not-allowed",
                  ].join(" ")}
                  id={`step-btn-${step.id}`}
                >
                  {i < stepIndex ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-4 w-4" />
                  )}
                </button>
                <span className={`hidden text-xs font-medium sm:block ${i === stepIndex ? "text-brand-600" : "text-slate-400"}`}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 transition-colors ${i < stepIndex ? "bg-brand-400" : "bg-slate-200"}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="card p-8 animate-fade-in">
        {/* Step 1: Type */}
        {currentStep === "type" && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">What do you want to do?</h2>
            <p className="text-sm text-slate-500 mb-6">Select your listing purpose</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {LISTING_TYPES.map((type) => (
                <button
                  key={type.value}
                  id={`listing-type-${type.value}`}
                  onClick={() => update("listingType", type.value)}
                  className={[
                    "flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all",
                    form.listingType === type.value
                      ? "border-brand-400 bg-brand-50"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <span className="text-3xl">{type.icon}</span>
                  <div>
                    <p className="font-semibold text-slate-800">{type.label}</p>
                    <p className="text-xs text-slate-500">{type.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <h3 className="text-base font-semibold text-slate-800 mb-3">Property Type</h3>
            <div className="flex flex-wrap gap-2">
              {PROPERTY_TYPES.map((type) => (
                <button
                  key={type}
                  id={`property-type-${type}`}
                  onClick={() => update("propertyType", type)}
                  className={[
                    "rounded-xl border px-4 py-2 text-sm capitalize transition-all",
                    form.propertyType === type
                      ? "border-brand-400 bg-brand-50 text-brand-700 font-medium"
                      : "border-slate-200 text-slate-700 hover:border-slate-300",
                  ].join(" ")}
                >
                  {type.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {currentStep === "details" && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Property Details</h2>
            <p className="text-sm text-slate-500 mb-6">Tell buyers about your property</p>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="post-title">
                  Title <span className="text-red-400">*</span>
                </label>
                <input id="post-title" type="text" value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="e.g. Spacious 3 BHK Apartment with City View"
                  className="input-base" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="post-desc">
                  Description
                </label>
                <textarea id="post-desc" rows={4} value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Describe your property — highlights, nearby amenities, unique features..."
                  className="input-base resize-none" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { id: "post-bedrooms", label: "Bedrooms", key: "bedrooms" as const },
                  { id: "post-bathrooms", label: "Bathrooms", key: "bathrooms" as const },
                  { id: "post-builtup", label: "Built-up Area (sqft)", key: "builtUpArea" as const },
                  { id: "post-floor", label: "Floor No.", key: "floorNumber" as const },
                ].map(({ id, label, key }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5" htmlFor={id}>{label}</label>
                    <input id={id} type="number" min="0"
                      value={(form[key] as number | undefined) ?? ""}
                      onChange={(e) => update(key, e.target.value ? Number(e.target.value) : undefined)}
                      className="input-base" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    label: "Furnishing", key: "furnishingStatus" as const,
                    options: ["", "unfurnished", "semi_furnished", "fully_furnished"],
                  },
                  {
                    label: "Possession", key: "possessionStatus" as const,
                    options: ["", "ready_to_move", "under_construction", "new_launch"],
                  },
                  {
                    label: "Facing", key: "facing" as const,
                    options: ["", "north", "south", "east", "west", "north_east", "north_west"],
                  },
                ].map(({ label, key, options }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
                    <select value={(form[key] as string | undefined) ?? ""}
                      onChange={(e) => update(key, e.target.value || undefined)}
                      className="input-base">
                      {options.map((o) => (
                        <option key={o} value={o}>{o ? o.replace(/_/g, " ") : `Select ${label}`}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Location */}
        {currentStep === "location" && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Location</h2>
            <p className="text-sm text-slate-500 mb-6">Where is your property?</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="post-address">
                  Full Address <span className="text-red-400">*</span>
                </label>
                <textarea id="post-address" rows={2} value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  placeholder="Building name, street, area..."
                  className="input-base resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5" htmlFor="post-locality">Locality *</label>
                  <input id="post-locality" type="text" value={form.locality}
                    onChange={(e) => update("locality", e.target.value)}
                    placeholder="e.g. Sector 62" className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5" htmlFor="post-city">City *</label>
                  <input id="post-city" type="text" value={form.city}
                    onChange={(e) => update("city", e.target.value)}
                    placeholder="e.g. Gurugram" className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5" htmlFor="post-state">State *</label>
                  <input id="post-state" type="text" value={form.state}
                    onChange={(e) => update("state", e.target.value)}
                    placeholder="e.g. Haryana" className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5" htmlFor="post-pincode">Pincode</label>
                  <input id="post-pincode" type="text" value={form.pincode}
                    onChange={(e) => update("pincode", e.target.value)}
                    placeholder="122001" className="input-base" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Pricing */}
        {currentStep === "pricing" && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Pricing</h2>
            <p className="text-sm text-slate-500 mb-6">Set your expected price</p>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="post-price">
                  Expected Price (₹) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₹</span>
                  <input id="post-price" type="number" min="0"
                    value={form.price ?? ""}
                    onChange={(e) => update("price", e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="5000000"
                    className="input-base pl-8" />
                </div>
                {form.price && (
                  <p className="mt-1.5 text-sm font-medium text-brand-600">
                    ≈ {form.price >= 10_000_000 ? `₹${(form.price / 10_000_000).toFixed(2)} Cr` : `₹${(form.price / 100_000).toFixed(2)} L`}
                  </p>
                )}
              </div>
              <label className="flex cursor-pointer items-center gap-3" htmlFor="post-negotiable">
                <input id="post-negotiable" type="checkbox"
                  checked={form.isNegotiable}
                  onChange={(e) => update("isNegotiable", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-500" />
                <span className="text-sm text-slate-700">Price is negotiable</span>
              </label>
            </div>
          </div>
        )}

        {/* Step 5: Photos */}
        {currentStep === "photos" && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Upload Photos</h2>
            <p className="text-sm text-slate-500 mb-6">
              Properties with photos get 5× more enquiries. Upload up to 20 photos.
            </p>
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-10 text-center hover:border-brand-300 hover:bg-brand-50/30 transition-colors cursor-pointer">
              <Upload className="mx-auto h-10 w-10 text-slate-400 mb-3" />
              <p className="text-sm font-medium text-slate-700">Drag & drop photos here</p>
              <p className="text-xs text-slate-400 mt-1">or click to browse — JPEG, PNG, WebP up to 10MB each</p>
              <button className="mt-4 rounded-xl border border-brand-400 px-5 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 transition-colors">
                Browse Files
              </button>
            </div>
            <p className="mt-4 text-xs text-slate-400 text-center">
              Photos will be watermarked with "99acresclone.com" automatically
            </p>
          </div>
        )}

        {/* Step 6: Review */}
        {currentStep === "review" && createdPropertyId && (
          <div className="text-center py-4 animate-fade-in">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 mx-auto mb-5">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Property Posted! 🎉</h2>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              Your listing is under review. We'll notify you once it goes live (usually within 2–4 hours).
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => router.push("/dashboard")}
                className="btn-brand px-8">
                Go to Dashboard
              </button>
              <button onClick={() => { setForm(initialForm); setCurrentStep("type"); setCreatedPropertyId(null); }}
                className="rounded-xl border border-slate-200 px-8 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                Post Another
              </button>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        {currentStep !== "review" && (
          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
            <button onClick={goPrev} disabled={stepIndex === 0}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>

            {currentStep !== "photos" ? (
              <button onClick={goNext} id="post-property-next-btn"
                className="btn-brand px-8">
                Continue <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={isSubmitting}
                id="post-property-submit-btn"
                className="btn-brand px-8 disabled:opacity-60">
                {isSubmitting ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  "Submit Listing"
                )}
              </button>
            )}
          </div>
        )}

        {errors["submit"] && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 text-center">{errors["submit"]}</p>
        )}
      </div>
    </div>
  );
}
