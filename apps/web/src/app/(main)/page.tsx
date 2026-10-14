import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { HeroSearch } from "@/components/common/HeroSearch";
import { PropertyCard } from "@/components/property/PropertyCard";
import { GuillocheBand, GuillocheFrame, GuillocheRosette } from "@/components/paper/Guilloche";
import { Seal } from "@/components/paper/Seal";
import { AffixedFootage } from "@/components/paper/AffixedFootage";
import { propertiesService } from "@/services/properties";
import type { PropertyListItem } from "@/types/property";

export const metadata: Metadata = {
  title: { absolute: "Aangan — Homes, plots and offices across India" },
  description:
    "Search flats, houses, plots, PG and commercial space for sale or rent across India. See who posted each listing and contact them directly.",
};

export const revalidate = 300;

async function getRecentListings(): Promise<PropertyListItem[]> {
  try {
    const res = await propertiesService.list({ sortBy: "popular", limit: 6 }, { revalidate: 300 });
    return res.data;
  } catch {
    return [];
  }
}

// Placeholder figures kept at the owner's request; not live data.
const SCHEDULE = [
  { value: "12L+", label: "properties listed" },
  { value: "4.5L+", label: "verified owners" },
  { value: "100+", label: "cities" },
  { value: "50L+", label: "families housed" },
];

const CITIES = [
  { name: "Mumbai", state: "Maharashtra", count: "3.2L+" },
  { name: "Bengaluru", state: "Karnataka", count: "2.8L+" },
  { name: "Delhi NCR", state: "Delhi, Haryana, UP", count: "3.8L+" },
  { name: "Hyderabad", state: "Telangana", count: "1.9L+" },
  { name: "Pune", state: "Maharashtra", count: "1.4L+" },
  { name: "Chennai", state: "Tamil Nadu", count: "1.2L+" },
  { name: "Kolkata", state: "West Bengal", count: "0.9L+" },
  { name: "Ahmedabad", state: "Gujarat", count: "0.8L+" },
];

const POPULAR = [
  { label: "3 BHK in Gurugram", href: "/search?listingType=buy&locality=Gurugram&minBedrooms=3&maxBedrooms=3" },
  { label: "2 BHK to rent in Bengaluru", href: "/search?listingType=rent&locality=Bengaluru&minBedrooms=2&maxBedrooms=2" },
  { label: "Villas in Pune", href: "/search?listingType=buy&locality=Pune&propertyType=villa" },
];

const CLAUSES = [
  "every listing names who posted it, owner, agent or builder, and the day it went live;",
  "a listing carries the registry seal only after a moderator has checked it;",
  "you can narrow by locality, budget, BHK and furnishing, on a list or on a map;",
  "your enquiry goes straight to the person who listed the home, by phone and email.",
];

export default async function HomePage() {
  const listings = await getRecentListings();

  return (
    <>
      {/* ══ The sheet ═════════════════════════════════════════════════════════ */}
      <section className="container-app pb-14 pt-6 sm:pt-10">
        <div className="sheet relative overflow-hidden px-6 pb-8 pt-10 sm:px-12 sm:pb-10 sm:pt-14 lg:px-16">
          <GuillocheFrame />
          <GuillocheRosette className="pointer-events-none absolute -right-24 -top-24 h-[380px] w-[380px] text-stamp/[0.09]" size={380} />

          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16">
            <div className="min-w-0">
              <h1 className="max-w-[16ch] font-display text-[44px] leading-[0.98] tracking-[-0.015em] text-ink sm:text-[64px] lg:text-[76px]">
                Find a home. Talk to whoever listed it.
              </h1>
              <p className="mt-5 max-w-[52ch] text-[17px] leading-relaxed text-ink-soft">
                Flats, houses, plots, PG and offices for sale or rent across India, each with the owner or agent one call away.
              </p>

              <div className="mt-9 max-w-[720px]">
                <HeroSearch />
              </div>

              <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-soft">
                <span>Often searched:</span>
                {POPULAR.map((p) => (
                  <Link key={p.href} href={p.href} className="link-ink">
                    {p.label}
                  </Link>
                ))}
              </p>
            </div>

            <div className="relative mx-auto hidden w-[260px] rotate-[1.5deg] lg:block lg:w-full">
              <AffixedFootage src="/assets/hero-bg.mp4" />
              <Seal
                className="absolute -bottom-10 -left-12"
                size={124}
                center="Verified"
                sub="LISTINGS"
                animate
              />
            </div>
          </div>

          {/* Sheet foot: the schedule */}
          <div className="relative mt-12">
            <div className="rule-double" />
            <dl className="grid grid-cols-2 gap-y-4 pt-5 md:grid-cols-4">
              {SCHEDULE.map((s, i) => (
                <div key={s.label} className={`flex items-baseline gap-2 ${i > 0 ? "md:border-l md:border-rule md:pl-6" : ""}`}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="tabular font-display text-[24px] leading-none text-stamp-dark">{s.value}</dd>
                  <dd className="text-sm text-ink-soft">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ══ Recent listings ═══════════════════════════════════════════════════ */}
      {listings.length > 0 && (
        <section className="container-app py-14">
          <div className="flex items-end justify-between gap-6">
            <h2 className="font-display text-[34px] leading-tight text-ink sm:text-[40px]">Most viewed this week</h2>
            <Link href="/search?sortBy=popular" className="hidden items-center gap-1.5 text-sm font-semibold text-seal hover:underline sm:inline-flex">
              All listings <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </section>
      )}

      {/* ══ The register of cities ════════════════════════════════════════════ */}
      <section className="border-y border-rule bg-paper-deep/60 py-16">
        <div className="container-app grid gap-10 lg:grid-cols-[320px_1fr] lg:gap-16">
          <div>
            <h2 className="font-display text-[34px] leading-tight text-ink sm:text-[40px]">Browse by city</h2>
            <p className="mt-3 max-w-[36ch] text-ink-soft">
              Start with a city and narrow by locality once you are in.
            </p>
          </div>
          <ol className="grid border-t border-ink/70 sm:grid-cols-2 sm:gap-x-10">
            {CITIES.map((c) => (
              <li key={c.name} className="border-b border-rule">
                <Link
                  href={`/search?listingType=buy&locality=${encodeURIComponent(c.name.replace(" NCR", ""))}`}
                  className="group flex items-baseline gap-4 py-4"
                >
                  <span className="font-display text-[24px] leading-none text-ink transition-colors group-hover:text-seal">{c.name}</span>
                  <span className="hidden flex-1 truncate text-sm text-ink-faint md:block">{c.state}</span>
                  <span className="tabular ml-auto text-sm text-ink-soft">{c.count}</span>
                  <ArrowUpRight className="h-4 w-4 self-center text-ink-faint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-seal" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ══ Whereas ═══════════════════════════════════════════════════════════ */}
      <section className="container-app py-20">
        <div className="mx-auto max-w-[860px]">
          <h2 className="font-display text-[34px] leading-tight text-ink sm:text-[40px]">How a listing reaches you</h2>
          <ol className="mt-8 space-y-5">
            {CLAUSES.map((text) => (
              <li key={text} className="grid grid-cols-[92px_1fr] gap-4 text-[17px] leading-relaxed sm:grid-cols-[120px_1fr]">
                <span className="font-typed text-[13px] font-bold uppercase tracking-[0.18em] text-stamp pt-1">Whereas</span>
                <span className="text-ink">{text}</span>
              </li>
            ))}
            <li className="grid grid-cols-[92px_1fr] gap-4 border-t border-rule pt-5 text-[17px] sm:grid-cols-[120px_1fr]">
              <span className="font-typed text-[13px] font-bold uppercase tracking-[0.18em] text-seal pt-1">Therefore</span>
              <span className="text-ink">
                start with a locality.{" "}
                <Link href="/search" className="link-ink font-semibold">Open the full search</Link>
              </span>
            </li>
          </ol>
        </div>
      </section>

      {/* ══ For listers ═══════════════════════════════════════════════════════ */}
      <section className="bg-stamp-dark text-paper">
        <GuillocheBand className="h-6 w-full text-paper/20" height={24} />
        <div className="container-app grid items-center gap-10 py-16 lg:grid-cols-[1fr_auto]">
          <div>
            <h2 className="max-w-[20ch] font-display text-[36px] leading-[1.05] sm:text-[48px]">
              Letting or selling? Post it here at no cost.
            </h2>
            <p className="mt-4 max-w-[56ch] text-[17px] text-paper/75">
              Add the details and photos, a moderator reviews it, and enquiries arrive in your dashboard with the buyer&apos;s number.
            </p>
          </div>
          <Link href="/dashboard/post-property" className="btn-seal !bg-paper-sheet !px-7 !py-3.5 !text-seal-dark hover:!bg-white">
            Post a property
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
