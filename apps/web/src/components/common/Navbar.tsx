"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu, X, Heart, Bell, ChevronDown, LogOut, User, LayoutDashboard, PlusCircle
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const navLinks = [
  { label: "Buy", href: "/search?listingType=buy" },
  { label: "Rent", href: "/search?listingType=rent" },
  { label: "Commercial", href: "/search?listingType=commercial_buy" },
  { label: "PG/Co-living", href: "/search?listingType=pg" },
  { label: "New Projects", href: "/search?listingType=new_project" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, isAuthenticated, clearAuth } = useAuthStore();

  // Detect scroll for nav shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isHome = pathname === "/";

  return (
    <header
      className={[
        "sticky top-0 z-40 w-full transition-all duration-200",
        scrolled || !isHome
          ? "bg-white border-b border-slate-100 shadow-sm"
          : "bg-transparent",
      ].join(" ")}
    >
      <div className="container-app flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl gradient-brand">
            <span className="text-sm font-bold text-white">99</span>
          </div>
          <span className="hidden font-display text-lg font-bold text-slate-900 sm:block">
            acres<span className="text-brand-500">clone</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={[
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
                pathname.startsWith("/search") && link.href.includes(pathname.split("?")[0] ?? "")
                  ? "bg-brand-50 text-brand-600"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              ].join(" ")}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Post Property CTA */}
          <Link
            href="/dashboard/post-property"
            className="hidden items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors duration-150 sm:flex"
            id="nav-post-property-btn"
          >
            <PlusCircle className="h-4 w-4" />
            Post Property
          </Link>

          {isAuthenticated && user ? (
            <>
              {/* Saved */}
              <Link
                href="/dashboard/saved"
                className="hidden rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors sm:flex"
                aria-label="Saved properties"
              >
                <Heart className="h-5 w-5" />
              </Link>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  aria-expanded={profileOpen}
                  aria-haspopup="true"
                  id="nav-profile-btn"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-brand-700 font-semibold text-xs">
                    {user.firstName[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span className="hidden sm:block">{user.firstName}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-slate-100 bg-white py-1.5 shadow-xl z-50 animate-slide-down">
                    <div className="border-b border-slate-100 px-4 py-2 mb-1">
                      <p className="text-sm font-semibold text-slate-900">{user.firstName} {user.lastName ?? ""}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email ?? user.phone}</p>
                    </div>
                    <Link href="/dashboard" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <LayoutDashboard className="h-4 w-4 text-slate-400" /> Dashboard
                    </Link>
                    <Link href="/dashboard/post-property" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <PlusCircle className="h-4 w-4 text-slate-400" /> Post Property
                    </Link>
                    <button
                      onClick={() => { clearAuth(); setProfileOpen(false); }}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      id="nav-logout-btn"
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/(auth)/login"
                className="hidden rounded-xl px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors sm:block"
                id="nav-login-btn">
                Login
              </Link>
              <Link href="/(auth)/signup"
                className="rounded-xl border border-brand-500 px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 transition-colors"
                id="nav-signup-btn">
                Sign up
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 md:hidden"
            aria-label="Toggle navigation"
            id="nav-mobile-menu-btn"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-3 md:hidden animate-slide-down">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-3 border-t border-slate-100 pt-3">
            <Link href="/dashboard/post-property"
              className="btn-brand w-full justify-center text-sm"
              onClick={() => setMobileOpen(false)}>
              Post Property FREE
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
