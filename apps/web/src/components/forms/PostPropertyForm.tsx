"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ImagePlus, Loader2, X } from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import { propertiesService } from "@/services/properties";
import { errorMessage } from "@/services/api";
import {
  formatPrice,
  isRental,
  rupeesInWords,
  FURNISHING_LABEL,
  LISTING_TYPE_LABEL,
  POSSESSION_LABEL,
  PROPERTY_TYPE_LABEL,
} from "@/types/property";
import type { Facing, FurnishingStatus, ListingType, NewPropertyInput, PossessionStatus, PropertyType } from "@/types/property";
import { Seal } from "@/components/paper/Seal";

type Step = "kind" | "details" | "location" | "price" | "photos" | "done";

const STEPS: Array<{ id: Step; label: string }> = [
  { id: "kind", label: "Listing" },
  { id: "details", label: "Details" },
  { id: "location", label: "Location" },
  { id: "price", label: "Price" },
  { id: "photos", label: "Photos" },
];

const LISTING_CHOICES: ListingType[] = ["buy", "rent", "pg", "commercial_buy", "commercial_rent", "plot_buy"];
const TYPE_CHOICES: PropertyType[] = ["apartment", "independent_house", "villa", "plot", "commercial_office", "commercial_shop", "warehouse", "pg_hostel", "farmhouse"];
const FACINGS: Array<{ value: Facing; label: string }> = [
  { value: "north", label: "North" }, { value: "south", label: "South" }, { value: "east", label: "East" }, { value: "west", label: "West" },
  { value: "north_east", label: "North-east" }, { value: "north_west", label: "North-west" }, { value: "south_east", label: "South-east" }, { value: "south_west", label: "South-west" },
];

const MAX_PHOTOS = 20;
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

interface FormState {
  listingType: ListingType | "";
  propertyType: PropertyType | "";
  title: string;
  description: string;
  bedrooms: string;
  bathrooms: string;
  builtUpArea: string;
  carpetArea: string;
  floorNumber: string;
  totalFloors: string;
  furnishingStatus: FurnishingStatus | "";
  possessionStatus: PossessionStatus | "";
  facing: Facing | "";
  address: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  price: string;
  isNegotiable: boolean;
}

const EMPTY: FormState = {
  listingType: "", propertyType: "", title: "", description: "",
  bedrooms: "", bathrooms: "", builtUpArea: "", carpetArea: "", floorNumber: "", totalFloors: "",
  furnishingStatus: "", possessionStatus: "", facing: "",
  address: "", locality: "", city: "", state: "", pincode: "",
  price: "", isNegotiable: false,
};

const num = (v: string) => (v.trim() === "" ? undefined : Number(v));

function validate(step: Step, f: FormState): Record<string, string> {
  const e: Record<string, string> = {};
  if (step === "kind") {
    if (!f.listingType) e["listingType"] = "Choose what you want to do";
    if (!f.propertyType) e["propertyType"] = "Choose the property type";
  }
  if (step === "details") {
    if (f.title.trim().length < 10) e["title"] = "Write a title of at least 10 characters";
    for (const k of ["bedrooms", "bathrooms", "floorNumber", "totalFloors"] as const) {
      if (f[k] && !Number.isInteger(Number(f[k]))) e[k] = "Whole numbers only";
    }
    for (const k of ["builtUpArea", "carpetArea"] as const) {
      if (f[k] && !(Number(f[k]) > 0)) e[k] = "Enter the area in sq.ft";
    }
  }
  if (step === "location") {
    if (f.address.trim().length < 5) e["address"] = "Enter the building and street";
    if (f.locality.trim().length < 2) e["locality"] = "Enter the locality";
    if (f.city.trim().length < 2) e["city"] = "Enter the city";
    if (f.state.trim().length < 2) e["state"] = "Enter the state";
    if (f.pincode && !/^\d{6}$/.test(f.pincode.trim())) e["pincode"] = "Pincode has 6 digits";
  }
  if (step === "price") {
    if (!(Number(f.price) > 0)) e["price"] = "Enter the expected price";
  }
  return e;
}

function toInput(f: FormState): NewPropertyInput {
  return {
    listingType: f.listingType as ListingType,
    propertyType: f.propertyType as PropertyType,
    title: f.title.trim(),
    description: f.description.trim() || undefined,
    bedrooms: num(f.bedrooms),
    bathrooms: num(f.bathrooms),
    builtUpArea: num(f.builtUpArea),
    carpetArea: num(f.carpetArea),
    floorNumber: num(f.floorNumber),
    totalFloors: num(f.totalFloors),
    furnishingStatus: f.furnishingStatus || undefined,
    possessionStatus: f.possessionStatus || undefined,
    facing: f.facing || undefined,
    address: f.address.trim(),
    locality: f.locality.trim(),
    city: f.city.trim(),
    state: f.state.trim(),
    pincode: f.pincode.trim() || undefined,
    price: Number(f.price),
    isNegotiable: f.isNegotiable,
  };
}

interface Photo {
  file: File;
  url: string;
  state: "queued" | "uploading" | "done" | "error";
  message?: string;
}

export function PostPropertyForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token, isAuthenticated, hasHydrated } = useAuthStore();
  const [step, setStep] = useState<Step>("kind");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const index = STEPS.findIndex((s) => s.id === step);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      const { [key]: _drop, ...rest } = e;
      return rest;
    });
  };

  const goNext = () => {
    const errs = validate(step, form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const next = STEPS[index + 1];
    if (next) setStep(next.id);
  };

  const submitListing = async () => {
    const errs = validate("price", form);
    setErrors(errs);
    if (Object.keys(errs).length || !token) return;
    setSubmitting(true);
    try {
      const res = await propertiesService.create(toInput(form), token);
      setPropertyId(res.data.id);
      void queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      void queryClient.invalidateQueries({ queryKey: ["me-stats"] });
      setStep("photos");
    } catch (err) {
      setErrors({ submit: errorMessage(err, "The listing couldn't be saved. Please try again.") });
    } finally {
      setSubmitting(false);
    }
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list).slice(0, MAX_PHOTOS - photos.length);
    setPhotos((prev) => [
      ...prev,
      ...incoming.map((file): Photo => {
        if (!ACCEPTED.includes(file.type)) return { file, url: "", state: "error", message: "Use JPEG, PNG or WebP" };
        if (file.size > MAX_BYTES) return { file, url: URL.createObjectURL(file), state: "error", message: "Larger than 10 MB" };
        return { file, url: URL.createObjectURL(file), state: "queued" };
      }),
    ]);
  };

  const uploadAll = async () => {
    if (!propertyId || !token) return;
    setUploading(true);
    let hasCover = photos.some((p) => p.state === "done");
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i]!;
      if (photo.state !== "queued") continue;
      setPhotos((prev) => prev.map((p, j) => (j === i ? { ...p, state: "uploading" } : p)));
      try {
        await propertiesService.uploadImage(propertyId, photo.file, token, !hasCover);
        hasCover = true;
        setPhotos((prev) => prev.map((p, j) => (j === i ? { ...p, state: "done" } : p)));
      } catch (err) {
        setPhotos((prev) => prev.map((p, j) => (j === i ? { ...p, state: "error", message: errorMessage(err, "Upload failed") } : p)));
      }
    }
    setUploading(false);
  };

  if (hasHydrated && !isAuthenticated) {
    return (
      <div className="sheet mx-auto max-w-lg p-8 text-center">
        <p className="font-display text-2xl text-ink">Sign in to post a property</p>
        <p className="mt-2 text-sm text-ink-soft">Enquiries for your listing come to your account, so we need one first.</p>
        <Link href="/login?next=/dashboard/post-property" className="btn-seal mt-5">Sign in</Link>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="sheet mx-auto max-w-xl px-8 py-12 text-center">
        <Seal className="mx-auto" size={128} center="Received" sub="FOR REVIEW" ring="LISTING RECEIVED · AANGAN REGISTRY ·" animate />
        <h2 className="mt-6 font-display text-[34px] leading-tight text-ink">Listing submitted</h2>
        <p className="mx-auto mt-2 max-w-[44ch] text-ink-soft">
          A moderator reviews it before it appears in search. You can follow its status under Your listings.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={() => router.push("/dashboard/listings")} className="btn-seal">Go to your listings</button>
          <button
            type="button"
            onClick={() => {
              photos.forEach((p) => p.url && URL.revokeObjectURL(p.url));
              setForm(EMPTY);
              setPhotos([]);
              setPropertyId(null);
              setStep("kind");
            }}
            className="btn-ink"
          >
            Post another
          </button>
        </div>
      </div>
    );
  }

  const err = (k: string) => (errors[k] ? <p id={`post-${k}-err`} className="mt-1 text-xs text-danger">{errors[k]}</p> : null);
  const text = (k: keyof FormState, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`post-${k}`} className="field-label">{label}</label>
      <input
        id={`post-${k}`}
        value={form[k] as string}
        onChange={(e) => set(k, e.target.value as never)}
        aria-invalid={!!errors[k]}
        aria-describedby={errors[k] ? `post-${k}-err` : undefined}
        className="input-line"
        {...props}
      />
      {err(k)}
    </div>
  );
  const select = <K extends "furnishingStatus" | "possessionStatus" | "facing">(k: K, label: string, options: Array<{ value: string; label: string }>) => (
    <div>
      <label htmlFor={`post-${k}`} className="field-label">{label}</label>
      <select id={`post-${k}`} value={form[k]} onChange={(e) => set(k, e.target.value as FormState[K])} className="input-box mt-1">
        <option value="">Not specified</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  const rental = form.listingType ? isRental(form.listingType) : false;
  const priceNum = Number(form.price);

  return (
    <div className="mx-auto max-w-3xl">
      {/* Progress */}
      <ol className="mb-8 grid grid-cols-5 border-t-2 border-rule" aria-label="Steps">
        {STEPS.map((s, i) => {
          const state = i < index ? "done" : i === index ? "current" : "todo";
          return (
            <li key={s.id} className={`-mt-[2px] border-t-2 pt-2 ${state === "todo" ? "border-transparent" : "border-seal"}`} aria-current={state === "current" ? "step" : undefined}>
              <span className={`text-xs font-semibold uppercase tracking-[0.1em] ${state === "todo" ? "text-ink-faint" : "text-ink"}`}>
                <span className="tabular mr-1 hidden text-ink-faint sm:inline">{i + 1}</span>{s.label}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="sheet px-6 py-8 sm:px-10">
        {step === "kind" && (
          <div className="space-y-8">
            <fieldset>
              <legend className="font-display text-2xl text-ink">What are you listing?</legend>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup">
                {LISTING_CHOICES.map((lt) => (
                  <button key={lt} type="button" role="radio" aria-checked={form.listingType === lt} onClick={() => set("listingType", lt)} className="chip !justify-start !py-3 text-[15px]">
                    {LISTING_TYPE_LABEL[lt]}
                  </button>
                ))}
              </div>
              {err("listingType")}
            </fieldset>
            <fieldset>
              <legend className="font-display text-2xl text-ink">Property type</legend>
              <div className="mt-4 flex flex-wrap gap-2" role="radiogroup">
                {TYPE_CHOICES.map((t) => (
                  <button key={t} type="button" role="radio" aria-checked={form.propertyType === t} onClick={() => set("propertyType", t)} className="chip">
                    {PROPERTY_TYPE_LABEL[t]}
                  </button>
                ))}
              </div>
              {err("propertyType")}
            </fieldset>
          </div>
        )}

        {step === "details" && (
          <div className="space-y-7">
            <h2 className="font-display text-2xl text-ink">Details</h2>
            {text("title", "Listing title", { placeholder: "Corner 3 BHK with two balconies, Baner", maxLength: 512 })}
            <div>
              <label htmlFor="post-description" className="field-label">Description</label>
              <textarea id="post-description" rows={5} maxLength={5000} value={form.description} onChange={(e) => set("description", e.target.value)}
                placeholder="What makes it worth a visit: light, layout, society, what's nearby"
                className="input-box mt-1 resize-y" />
            </div>
            <div className="grid grid-cols-2 gap-7 sm:grid-cols-3">
              {text("bedrooms", "Bedrooms", { inputMode: "numeric" })}
              {text("bathrooms", "Bathrooms", { inputMode: "numeric" })}
              {text("builtUpArea", "Built-up area (sq.ft)", { inputMode: "decimal" })}
              {text("carpetArea", "Carpet area (sq.ft)", { inputMode: "decimal" })}
              {text("floorNumber", "Floor", { inputMode: "numeric" })}
              {text("totalFloors", "Total floors", { inputMode: "numeric" })}
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              {select("furnishingStatus", "Furnishing", Object.entries(FURNISHING_LABEL).map(([value, label]) => ({ value, label })))}
              {select("possessionStatus", "Possession", Object.entries(POSSESSION_LABEL).map(([value, label]) => ({ value, label })))}
              {select("facing", "Facing", FACINGS)}
            </div>
          </div>
        )}

        {step === "location" && (
          <div className="space-y-7">
            <h2 className="font-display text-2xl text-ink">Location</h2>
            {text("address", "Building and street", { autoComplete: "street-address" })}
            <div className="grid gap-7 sm:grid-cols-2">
              {text("locality", "Locality", { placeholder: "Baner" })}
              {text("city", "City", { placeholder: "Pune", autoComplete: "address-level2" })}
              {text("state", "State", { placeholder: "Maharashtra", autoComplete: "address-level1" })}
              {text("pincode", "Pincode", { inputMode: "numeric", maxLength: 6, autoComplete: "postal-code" })}
            </div>
          </div>
        )}

        {step === "price" && (
          <div className="space-y-7">
            <h2 className="font-display text-2xl text-ink">{rental ? "Monthly rent" : "Expected price"}</h2>
            <div>
              <label htmlFor="post-price" className="field-label">Amount in rupees</label>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl text-ink-soft">₹</span>
                <input
                  id="post-price"
                  inputMode="numeric"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value.replace(/[^\d]/g, ""))}
                  aria-invalid={!!errors["price"]}
                  aria-describedby="post-price-words"
                  className="input-line tabular font-display !text-[36px]"
                  placeholder={rental ? "35000" : "8500000"}
                />
              </div>
              <p id="post-price-words" className="mt-2 font-typed text-[13px] capitalize text-ink-soft" aria-live="polite">
                {priceNum > 0 ? `${formatPrice(priceNum)}${rental ? " a month" : ""} · ${rupeesInWords(priceNum)}` : ""}
              </p>
              {err("price")}
            </div>
            <label className="flex cursor-pointer items-center gap-3 text-[15px] text-ink">
              <input type="checkbox" checked={form.isNegotiable} onChange={(e) => set("isNegotiable", e.target.checked)} className="h-4 w-4 accent-[rgb(var(--seal))]" />
              Open to negotiation
            </label>
            <p className="border-t border-rule pt-4 text-sm text-ink-soft">
              Submitting sends the listing to a moderator. You can add photos on the next step.
            </p>
            {errors["submit"] && <p role="alert" className="text-sm text-danger">{errors["submit"]}</p>}
          </div>
        )}

        {step === "photos" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl text-ink">Photos</h2>
              <p className="mt-1 text-sm text-ink-soft">Up to {MAX_PHOTOS} photos, JPEG, PNG or WebP, 10 MB each. The first one becomes the cover.</p>
            </div>

            <input ref={fileRef} type="file" accept={ACCEPTED.join(",")} multiple className="sr-only" id="post-photos"
              onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
            <label
              htmlFor="post-photos"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-sheet border border-dashed border-stamp/50 bg-paper px-6 py-10 text-center transition-colors hover:border-seal hover:bg-seal-wash/40"
            >
              <ImagePlus className="h-7 w-7 text-stamp" strokeWidth={1.5} aria-hidden="true" />
              <span className="font-semibold text-ink">Choose photos or drop them here</span>
              <span className="tabular text-xs text-ink-faint">{photos.length} of {MAX_PHOTOS} added</span>
            </label>

            {photos.length > 0 && (
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {photos.map((p, i) => (
                  <li key={`${p.file.name}-${i}`} className="relative aspect-square overflow-hidden rounded-sheet border border-rule bg-paper-deep">
                    {p.url && <img src={p.url} alt="" className="h-full w-full object-cover" />}
                    {i === 0 && <span className="absolute left-0 top-0 bg-ink/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-paper-sheet">Cover</span>}
                    <span className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-paper-sheet/90 px-2 py-1 text-[11px] text-ink">
                      {p.state === "uploading" && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}
                      {p.state === "done" && <Check className="h-3 w-3 text-stamp" aria-hidden="true" />}
                      <span className={`truncate ${p.state === "error" ? "text-danger" : ""}`}>
                        {p.state === "error" ? p.message : p.state === "done" ? "Uploaded" : p.state === "uploading" ? "Uploading" : "Ready"}
                      </span>
                    </span>
                    {p.state !== "uploading" && p.state !== "done" && (
                      <button type="button" aria-label="Remove photo" className="absolute right-1 top-1 rounded-sheet bg-paper-sheet/90 p-1 text-ink hover:bg-paper-sheet"
                        onClick={() => { if (p.url) URL.revokeObjectURL(p.url); setPhotos((prev) => prev.filter((_, j) => j !== i)); }}>
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-10 flex items-center justify-between gap-3 border-t border-rule pt-6">
          {step === "photos" ? (
            <button type="button" className="btn-quiet" onClick={() => setStep("done")} disabled={uploading}>
              {photos.some((p) => p.state === "done") ? "Finish" : "Skip for now"}
            </button>
          ) : (
            <button type="button" className="btn-quiet" onClick={() => { const prev = STEPS[index - 1]; if (prev) setStep(prev.id); }} disabled={index === 0}>
              Back
            </button>
          )}

          {step === "price" ? (
            <button type="button" className="btn-seal" onClick={() => void submitListing()} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Submit listing
            </button>
          ) : step === "photos" ? (
            <button
              type="button"
              className="btn-seal"
              disabled={uploading || !photos.some((p) => p.state === "queued")}
              onClick={async () => {
                await uploadAll();
              }}
            >
              {uploading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {uploading ? "Uploading" : "Upload photos"}
            </button>
          ) : (
            <button type="button" className="btn-seal" onClick={goNext}>Continue</button>
          )}
        </div>
      </div>
    </div>
  );
}
