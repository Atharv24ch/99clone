/**
 * Local demo data: one lister account and a spread of live listings.
 *   SEED_PASSWORD=... pnpm --filter @99acres/api-server seed:demo
 * Refuses to run against production. Listings are marked as demo data in
 * their description so they can never be mistaken for real inventory.
 */
import { db, users, properties } from "@99acres/db";
import { eq } from "drizzle-orm";

import { hashPassword } from "../services/password.js";

const dbUrl = process.env["DATABASE_URL"];
const dbHost = dbUrl ? new URL(dbUrl).hostname : "localhost";
if (process.env["NODE_ENV"] === "production" || !["localhost", "127.0.0.1", "::1"].includes(dbHost)) {
  console.error(`seed:demo only runs against a local database (DATABASE_URL host is ${dbHost}).`);
  process.exit(1);
}

const email = process.env["SEED_EMAIL"] ?? "demo.lister@aangan.test";
const password = process.env["SEED_PASSWORD"];
if (!password || password.length < 8) {
  console.error("Set SEED_PASSWORD (8+ characters) for the demo lister account.");
  process.exit(1);
}

type Row = {
  title: string; listingType: "buy" | "rent" | "pg" | "commercial_buy" | "plot_buy";
  propertyType: "apartment" | "independent_house" | "villa" | "plot" | "commercial_office" | "pg_hostel";
  price: number; bedrooms?: number; bathrooms?: number; builtUpArea?: number;
  locality: string; city: string; state: string; lat: number; lng: number;
  furnishing?: "unfurnished" | "semi_furnished" | "fully_furnished";
  possession?: "ready_to_move" | "under_construction" | "new_launch";
  verified?: boolean; floor?: number; totalFloors?: number;
};

const ROWS: Row[] = [
  { title: "Corner 3 BHK with two balconies near Baner Road", listingType: "buy", propertyType: "apartment", price: 14_500_000, bedrooms: 3, bathrooms: 3, builtUpArea: 1480, locality: "Baner", city: "Pune", state: "Maharashtra", lat: 18.559, lng: 73.7868, furnishing: "semi_furnished", possession: "ready_to_move", verified: true, floor: 9, totalFloors: 14 },
  { title: "Garden-facing 2 BHK in a gated society", listingType: "rent", propertyType: "apartment", price: 34_000, bedrooms: 2, bathrooms: 2, builtUpArea: 1050, locality: "Kharadi", city: "Pune", state: "Maharashtra", lat: 18.5515, lng: 73.9348, furnishing: "fully_furnished", possession: "ready_to_move", verified: true, floor: 4, totalFloors: 11 },
  { title: "Independent 4 BHK house with terrace and parking", listingType: "buy", propertyType: "independent_house", price: 32_000_000, bedrooms: 4, bathrooms: 4, builtUpArea: 2600, locality: "Indiranagar", city: "Bengaluru", state: "Karnataka", lat: 12.9784, lng: 77.6408, furnishing: "semi_furnished", possession: "ready_to_move" },
  { title: "Bright 1 BHK close to the metro, ideal for one person", listingType: "rent", propertyType: "apartment", price: 22_000, bedrooms: 1, bathrooms: 1, builtUpArea: 620, locality: "HSR Layout", city: "Bengaluru", state: "Karnataka", lat: 12.9116, lng: 77.6474, furnishing: "fully_furnished", possession: "ready_to_move", verified: true, floor: 2, totalFloors: 4 },
  { title: "3 BHK in a new tower, possession next year", listingType: "buy", propertyType: "apartment", price: 21_500_000, bedrooms: 3, bathrooms: 3, builtUpArea: 1820, locality: "Sector 65", city: "Gurugram", state: "Haryana", lat: 28.4049, lng: 77.0646, furnishing: "unfurnished", possession: "under_construction" },
  { title: "Furnished office for 30 seats with a cabin", listingType: "commercial_buy", propertyType: "commercial_office", price: 26_000_000, builtUpArea: 2100, locality: "Andheri East", city: "Mumbai", state: "Maharashtra", lat: 19.1136, lng: 72.8697, furnishing: "fully_furnished", possession: "ready_to_move", verified: true, floor: 6, totalFloors: 12 },
  { title: "Sea-facing 2 BHK in an older building", listingType: "buy", propertyType: "apartment", price: 41_000_000, bedrooms: 2, bathrooms: 2, builtUpArea: 980, locality: "Bandra West", city: "Mumbai", state: "Maharashtra", lat: 19.0596, lng: 72.8295, furnishing: "semi_furnished", possession: "ready_to_move", floor: 7, totalFloors: 8 },
  { title: "Residential plot, east-facing, clear title", listingType: "plot_buy", propertyType: "plot", price: 6_800_000, builtUpArea: 2400, locality: "Shamshabad", city: "Hyderabad", state: "Telangana", lat: 17.2403, lng: 78.4294 },
  { title: "Twin-sharing PG with meals for working women", listingType: "pg", propertyType: "pg_hostel", price: 11_500, bedrooms: 1, bathrooms: 1, locality: "Velachery", city: "Chennai", state: "Tamil Nadu", lat: 12.9815, lng: 80.218, furnishing: "fully_furnished", possession: "ready_to_move", verified: true },
  { title: "Villa with private lawn in a low-density layout", listingType: "buy", propertyType: "villa", price: 58_000_000, bedrooms: 5, bathrooms: 5, builtUpArea: 4200, locality: "Gachibowli", city: "Hyderabad", state: "Telangana", lat: 17.4401, lng: 78.3489, furnishing: "unfurnished", possession: "new_launch" },
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);

let [owner] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
if (!owner) {
  [owner] = await db
    .insert(users)
    .values({ email, firstName: "Demo", lastName: "Lister", role: "agent", phone: "+91 90000 00000", passwordHash: await hashPassword(password) })
    .returning({ id: users.id });
}
if (!owner) throw new Error("Could not create demo lister");

let created = 0;
for (const [i, r] of ROWS.entries()) {
  const s = `${slug(r.title)}-demo${i}`;
  const [exists] = await db.select({ id: properties.id }).from(properties).where(eq(properties.slug, s)).limit(1);
  if (exists) continue;
  await db.insert(properties).values({
    slug: s,
    title: r.title,
    description: "Demo listing created by the local seed script. Not real inventory.",
    listingType: r.listingType,
    propertyType: r.propertyType,
    ownerId: owner.id,
    price: String(r.price),
    pricePerSqFt: r.builtUpArea ? (r.price / r.builtUpArea).toFixed(2) : null,
    bedrooms: r.bedrooms ?? null,
    bathrooms: r.bathrooms ?? null,
    builtUpArea: r.builtUpArea ? String(r.builtUpArea) : null,
    floorNumber: r.floor ?? null,
    totalFloors: r.totalFloors ?? null,
    address: `Demo address ${i + 1}`,
    locality: r.locality,
    city: r.city,
    state: r.state,
    latitude: String(r.lat),
    longitude: String(r.lng),
    furnishingStatus: r.furnishing ?? null,
    possessionStatus: r.possession ?? null,
    status: "active",
    isVerified: r.verified ?? false,
    viewCount: 40 + i * 37,
    listedAt: new Date(Date.now() - i * 86_400_000),
  });
  created++;
}

console.log(`Demo lister ${email}; ${created} listings added.`);
process.exit(0);
