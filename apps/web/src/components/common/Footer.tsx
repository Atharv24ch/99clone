import Link from "next/link";

import { Logo } from "@/components/brand/Logo";
import { GuillocheBand } from "@/components/paper/Guilloche";

const columns = [
  {
    title: "Find",
    links: [
      { label: "Flats for sale", href: "/search?listingType=buy&propertyType=apartment" },
      { label: "Flats for rent", href: "/search?listingType=rent&propertyType=apartment" },
      { label: "Independent houses", href: "/search?propertyType=independent_house" },
      { label: "Plots and land", href: "/search?listingType=plot_buy" },
      { label: "Offices and shops", href: "/search?listingType=commercial_buy" },
      { label: "PG and co-living", href: "/search?listingType=pg" },
    ],
  },
  {
    title: "List",
    links: [
      { label: "Post a property", href: "/dashboard/post-property" },
      { label: "Your listings", href: "/dashboard/listings" },
      { label: "Enquiries", href: "/dashboard/leads" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Create account", href: "/signup" },
      { label: "Saved listings", href: "/dashboard/saved" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto bg-stamp-dark text-paper">
      <GuillocheBand className="h-6 w-full text-paper/25" height={24} />
      <div className="container-app grid gap-10 py-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Logo tone="paper" />
          <p className="mt-4 text-sm leading-relaxed text-paper/70">
            Homes, plots and offices across India, each listed with who posted it and when.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h2 className="field-label !text-paper/60">{col.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-paper/85 hover:text-paper hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-paper/15">
        <p className="container-app py-5 text-xs text-paper/55">© {new Date().getFullYear()} Aangan</p>
      </div>
    </footer>
  );
}
