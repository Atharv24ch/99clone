import React from "react";
import Link from "next/link";
import { MapPin, Phone, Mail, Facebook, Twitter, Instagram, Youtube, Linkedin } from "lucide-react";

const footerLinks = {
  properties: {
    title: "Properties",
    links: [
      { label: "Apartments for Sale", href: "/search?listingType=buy&propertyType=apartment" },
      { label: "Apartments for Rent", href: "/search?listingType=rent&propertyType=apartment" },
      { label: "Villas & Houses", href: "/search?propertyType=independent_house" },
      { label: "Plots & Land", href: "/search?propertyType=plot" },
      { label: "Commercial Spaces", href: "/search?listingType=commercial_buy" },
      { label: "PG / Co-living", href: "/search?listingType=pg" },
    ],
  },
  company: {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Press", href: "/press" },
      { label: "Blog", href: "/blog" },
      { label: "Partner With Us", href: "/partner" },
    ],
  },
  support: {
    title: "Support",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Report a Fraud", href: "/report" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Cookie Policy", href: "/cookies" },
    ],
  },
};

const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Youtube, href: "#", label: "YouTube" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
];

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      {/* Main footer grid */}
      <div className="container-app py-14">
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-5">
          {/* Brand column */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-brand">
                <span className="text-sm font-bold text-white">99</span>
              </div>
              <span className="font-display text-xl font-bold text-white">
                acres<span className="text-brand-400">clone</span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-slate-400 max-w-xs">
              India's most trusted real estate portal. Find verified property listings for buying, renting, and investing across 100+ cities.
            </p>

            {/* Contact */}
            <div className="mt-6 space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Phone className="h-4 w-4 text-brand-400 flex-shrink-0" />
                <span>1800-123-4567 (Toll free)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Mail className="h-4 w-4 text-brand-400 flex-shrink-0" />
                <span>support@99acresclone.in</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <MapPin className="h-4 w-4 text-brand-400 flex-shrink-0" />
                <span>Gurugram, Haryana, India</span>
              </div>
            </div>

            {/* Social */}
            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:bg-brand-500 hover:text-white transition-all duration-150"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h3 className="mb-4 text-sm font-semibold text-white">{section.title}</h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-brand-400 transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800">
        <div className="container-app flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} 99acres Clone. All rights reserved.
          </p>
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-600">Built with</span>
            <span className="text-brand-400 text-xs">♥</span>
            <span className="text-xs text-slate-600">using Next.js, Fastify & PostGIS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
