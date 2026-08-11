import type { Metadata } from "next";
import React from "react";
import Link from "next/link";
import {
  TrendingUp, Shield, Search, Star, Building2,
  ArrowRight, CheckCircle, Users, MapPin, Phone,
} from "lucide-react";
import { HeroSearch } from "@/components/common/HeroSearch";
import { propertiesService } from "@/services/properties";
import { PropertyCard } from "@/components/property/PropertyCard";

export const metadata: Metadata = {
  title: "99acres Clone — India's #1 Real Estate Marketplace",
  description:
    "Find your dream home. Search from millions of verified property listings across India. Apartments, villas, plots, commercial spaces, PG and more.",
};

// ─── Data helpers ─────────────────────────────────────────────────────────────

async function getFeaturedProperties() {
  try {
    const res = await propertiesService.list({
      listingType: "buy",
      sortBy: "popular",
      limit: 6,
    });
    return res.data;
  } catch {
    return [];
  }
}

// ─── Static constants ─────────────────────────────────────────────────────────

const STATS = [
  { value: "12L+", label: "Properties Listed", icon: Building2 },
  { value: "4.5L+", label: "Verified Owners", icon: Shield },
  { value: "100+", label: "Cities Covered", icon: MapPin },
  { value: "50L+", label: "Happy Families", icon: Users },
];

const FEATURES = [
  {
    icon: Shield,
    title: "Verified Listings",
    desc: "Every property goes through a 7-point verification process for a fraud-free experience.",
  },
  {
    icon: Search,
    title: "Smart Search",
    desc: "AI-powered search with geospatial filters, map view, and sub-second results.",
  },
  {
    icon: TrendingUp,
    title: "Price Insights",
    desc: "Real-time price trends and locality comparisons to help you negotiate better.",
  },
  {
    icon: Phone,
    title: "Instant Connect",
    desc: "Direct contact with verified owners and agents — no middlemen, no hidden fees.",
  },
];

const POPULAR_CITIES = [
  { name: "Mumbai", count: "3.2L+", emoji: "🏙️" },
  { name: "Bengaluru", count: "2.8L+", emoji: "🌳" },
  { name: "Delhi NCR", count: "3.8L+", emoji: "🏛️" },
  { name: "Hyderabad", count: "1.9L+", emoji: "🕌" },
  { name: "Pune", count: "1.4L+", emoji: "🏘️" },
  { name: "Chennai", count: "1.2L+", emoji: "🌊" },
  { name: "Kolkata", count: "0.9L+", emoji: "🎭" },
  { name: "Ahmedabad", count: "0.8L+", emoji: "🏺" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const featuredProperties = await getFeaturedProperties();

  return (
    <>
      {/* ══ Hero ══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[600px] flex items-center">
        <div className="container-app relative z-10 py-28">
          <div className="max-w-3xl mx-auto text-center">

            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 glass-card px-4 py-1.5 text-sm text-white/90 mb-6">
              <Star className="h-3.5 w-3.5 text-orange-400 fill-orange-400" />
              <span className="drop-shadow-sm">India&apos;s Most Trusted Real Estate Platform</span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white drop-shadow-lg mb-4 text-balance">
              Find Your Perfect{" "}
              <span className="text-orange-400">Dream Home</span>
            </h1>
            <p className="text-lg text-white/80 drop-shadow-sm mb-10 max-w-xl mx-auto text-pretty">
              Search from <strong className="text-white">12 lakh+</strong> verified
              properties for sale, rent, and PG across 100+ Indian cities.
            </p>

            {/* Search box — glass-card container */}
            <div className="glass-card p-3 mb-6">
              <HeroSearch />
            </div>

            {/* Popular quick-links */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-white/70">
              <span className="drop-shadow-sm">Popular:</span>
              {["3 BHK in Gurgaon", "2 BHK in Bangalore", "Villa in Pune"].map((q) => (
                <Link
                  key={q}
                  href={`/search?q=${encodeURIComponent(q)}`}
                  className="glass-card px-3 py-1 text-xs text-white/80 hover:text-white glass-card-hover"
                >
                  {q}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ Stats strip ═══════════════════════════════════════════════════════ */}
      <section className="glass-nav border-y border-white/10">
        <div className="container-app py-8">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-orange-500/20 ring-1 ring-orange-400/30">
                  <Icon className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-white drop-shadow-sm">{value}</p>
                  <p className="text-xs text-white/60">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ Featured Properties ════════════════════════════════════════════════ */}
      {featuredProperties.length > 0 && (
        <section className="py-16">
          <div className="container-app">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="font-display text-2xl font-bold text-white drop-shadow-sm">
                  Featured Properties
                </h2>
                <p className="mt-1 text-sm text-white/60">Hand-picked verified listings</p>
              </div>
              <Link
                href="/search?listingType=buy"
                className="flex items-center gap-1 text-sm font-medium text-orange-400 hover:text-orange-300 transition-colors"
              >
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProperties.map((property) => (
                <div
                  key={property.id}
                  className="glass-card glass-card-hover overflow-hidden"
                >
                  <PropertyCard property={property} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ Browse by City ════════════════════════════════════════════════════ */}
      <section className="py-16">
        <div className="container-app">
          <h2 className="font-display text-2xl font-bold text-white drop-shadow-sm mb-2 text-center">
            Explore Properties by City
          </h2>
          <p className="text-sm text-white/60 mb-10 text-center">
            Find properties in India&apos;s top real estate markets
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {POPULAR_CITIES.map(({ name, count, emoji }) => (
              <Link
                key={name}
                href={`/search?city=${encodeURIComponent(name)}&listingType=buy`}
                className="glass-card glass-card-hover group flex flex-col items-center gap-2 p-5"
              >
                <span className="text-3xl">{emoji}</span>
                <p className="font-semibold text-white group-hover:text-orange-400 transition-colors drop-shadow-sm">
                  {name}
                </p>
                <p className="text-xs text-white/50">{count} properties</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ Why Choose Us ════════════════════════════════════════════════════ */}
      <section className="py-16">
        <div className="container-app">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl font-bold text-white drop-shadow-sm mb-2">
              Why 99acres Clone?
            </h2>
            <p className="text-sm text-white/60 max-w-md mx-auto">
              Built for Indian home buyers, renters, and investors with tools
              you won&apos;t find elsewhere
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass-card p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl mb-4 bg-orange-500/20 ring-1 ring-orange-400/20">
                  <Icon className="h-6 w-6 text-orange-400" />
                </div>
                <h3 className="font-semibold text-white drop-shadow-sm mb-2">{title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ Post Property CTA ════════════════════════════════════════════════ */}
      <section className="py-16">
        <div className="container-app">
          <div className="glass-card relative overflow-hidden p-10 sm:p-14 text-center"
            style={{
              background: "linear-gradient(135deg, rgba(249,115,22,0.25) 0%, rgba(234,88,12,0.15) 100%)",
            }}
          >
            {/* Decorative blobs */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-500/15 blur-3xl" aria-hidden="true" />
            <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-orange-400/10 blur-2xl" aria-hidden="true" />

            <div className="relative z-10">
              <p className="text-sm font-semibold text-orange-300 uppercase tracking-wide mb-3">
                Post your property
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white drop-shadow-md mb-4 text-balance">
                List Your Property for FREE
              </h2>
              <p className="text-white/80 mb-8 max-w-md mx-auto drop-shadow-sm">
                Reach 50 lakh+ active property seekers. Get genuine leads
                directly to your phone.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/dashboard/post-property"
                  id="home-post-property-btn"
                  className="glass-button inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-bold shadow-xl"
                >
                  Post Property FREE
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <div className="flex items-center gap-4 text-white/70 text-sm">
                  {["No Hidden Fees", "Verified Buyers", "Instant Leads"].map((t) => (
                    <span key={t} className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-orange-400/70" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
