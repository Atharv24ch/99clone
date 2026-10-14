"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Menu, X, ChevronDown, Bookmark, LayoutGrid, LogOut, Plus, UserRound } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { useAuthStore } from "@/store/authStore";

const navLinks = [
  { label: "Buy", listingType: "buy" },
  { label: "Rent", listingType: "rent" },
  { label: "Commercial", listingType: "commercial_buy" },
  { label: "PG", listingType: "pg" },
  { label: "Plots", listingType: "plot_buy" },
  { label: "New projects", listingType: "new_project" },
];

export function Navbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, hasHydrated, clearAuth } = useAuthStore();

  const activeType = pathname === "/search" ? searchParams.get("listingType") : null;

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!profileOpen) return;
    const onDown = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setProfileOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [profileOpen]);

  const signOut = () => {
    clearAuth();
    setProfileOpen(false);
    router.push("/");
  };

  const signedIn = hasHydrated && isAuthenticated && user;

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/95 backdrop-blur-[2px] supports-[backdrop-filter]:bg-paper/85">
      <div className="container-app flex h-16 items-center justify-between gap-6">
        <Logo />

        <nav aria-label="Listing types" className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => {
            const active = activeType === link.listingType;
            return (
              <Link
                key={link.listingType}
                href={`/search?listingType=${link.listingType}`}
                aria-current={active ? "page" : undefined}
                className={[
                  "relative px-3 py-2 text-[15px] font-medium transition-colors",
                  active ? "text-ink" : "text-ink-soft hover:text-ink",
                ].join(" ")}
              >
                {link.label}
                {active && <span className="absolute inset-x-3 -bottom-[13px] h-[2px] bg-seal" aria-hidden="true" />}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/post-property" className="btn-ink hidden !px-4 !py-2 text-sm sm:inline-flex">
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Post a property
          </Link>

          {!hasHydrated ? (
            <span className="hidden h-9 w-20 sm:block" aria-hidden="true" />
          ) : signedIn ? (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((o) => !o)}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-sheet px-2 py-1.5 text-sm font-medium text-ink hover:bg-paper-deep"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-stamp/40 bg-paper-sheet font-display text-[15px] text-stamp">
                  {user.firstName[0]?.toUpperCase() ?? "A"}
                </span>
                <span className="hidden max-w-[10ch] truncate md:block">{user.firstName}</span>
                <ChevronDown className={`h-4 w-4 text-ink-soft transition-transform ${profileOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>

              {profileOpen && (
                <div role="menu" className="sheet absolute right-0 top-full mt-2 w-60 animate-rise py-1.5">
                  <div className="border-b border-rule px-4 pb-2.5 pt-1.5">
                    <p className="text-sm font-semibold text-ink">{user.firstName} {user.lastName ?? ""}</p>
                    <p className="truncate text-xs text-ink-soft">{user.email ?? user.phone}</p>
                  </div>
                  {[
                    { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
                    { href: "/dashboard/saved", label: "Saved listings", icon: Bookmark },
                    { href: "/dashboard/profile", label: "Profile", icon: UserRound },
                  ].map(({ href, label, icon: Icon }) => (
                    <Link key={href} href={href} role="menuitem" className="flex items-center gap-3 px-4 py-2 text-sm text-ink hover:bg-paper-deep">
                      <Icon className="h-4 w-4 text-ink-faint" strokeWidth={1.75} aria-hidden="true" />
                      {label}
                    </Link>
                  ))}
                  <button type="button" role="menuitem" onClick={signOut} className="flex w-full items-center gap-3 border-t border-rule px-4 py-2 text-sm text-danger hover:bg-paper-deep">
                    <LogOut className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Link href="/login" className="btn-quiet hidden sm:inline-flex">Sign in</Link>
              <Link href="/signup" className="btn-seal !px-4 !py-2 text-sm">Create account</Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="btn-quiet !p-2 lg:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav aria-label="Listing types" className="border-t border-rule bg-paper-sheet lg:hidden">
          <div className="container-app grid grid-cols-2 gap-x-6 py-3">
            {navLinks.map((link) => (
              <Link key={link.listingType} href={`/search?listingType=${link.listingType}`} className="border-b border-rule/70 py-3 text-[15px] font-medium text-ink">
                {link.label}
              </Link>
            ))}
          </div>
          <div className="container-app flex gap-3 pb-4">
            <Link href="/dashboard/post-property" className="btn-ink flex-1 text-sm">Post a property</Link>
            {!signedIn && <Link href="/login" className="btn-quiet flex-1 border border-rule text-sm">Sign in</Link>}
          </div>
        </nav>
      )}
    </header>
  );
}
