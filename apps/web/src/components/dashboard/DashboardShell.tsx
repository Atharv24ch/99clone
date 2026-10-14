"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAuthStore } from "@/store/authStore";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/listings", label: "Your listings" },
  { href: "/dashboard/leads", label: "Enquiries" },
  { href: "/dashboard/saved", label: "Saved" },
  { href: "/dashboard/profile", label: "Profile" },
];

/**
 * Gate + frame for every /dashboard page. Waits for persisted auth before
 * deciding, so a refresh never bounces a signed-in user to the login page.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [hasHydrated, isAuthenticated, pathname, router]);

  if (!hasHydrated || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-ink-soft">
        <Loader2 className="h-5 w-5 animate-spin" aria-label="Loading your account" />
      </div>
    );
  }

  const nav = user.role === "admin" ? [...NAV, { href: "/dashboard/moderation", label: "Moderation" }] : NAV;

  return (
    <div className="container-app py-8 lg:py-10">
      <div className="grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-12">
        <nav aria-label="Dashboard" className="-mx-4 overflow-x-auto border-b border-rule px-4 lg:mx-0 lg:overflow-visible lg:border-b-0 lg:px-0">
          <ul className="flex gap-1 lg:sticky lg:top-24 lg:flex-col lg:gap-0.5">
            {nav.map((item) => {
              const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "block whitespace-nowrap px-3 py-2.5 text-[15px] transition-colors lg:border-l-2 lg:py-2",
                      active
                        ? "border-b-2 border-seal font-semibold text-ink lg:border-b-0 lg:border-l-seal"
                        : "border-b-2 border-transparent text-ink-soft hover:text-ink lg:border-b-0 lg:border-l-transparent",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li className="lg:mt-4">
              <Link href="/dashboard/post-property" className="btn-seal !py-2 text-sm lg:w-full">Post a property</Link>
            </li>
          </ul>
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

export function PageTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-ink/70 pb-4">
      <h1 className="font-display text-[34px] leading-tight text-ink sm:text-[40px]">{title}</h1>
      {children}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="sheet px-6 py-12 text-center">
      <p className="font-display text-2xl text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-[44ch] text-sm text-ink-soft">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="sheet px-6 py-10 text-center">
      <p className="font-display text-2xl text-ink">Couldn&apos;t load this</p>
      <p className="mt-2 text-sm text-ink-soft">The server didn&apos;t respond.</p>
      <button type="button" onClick={onRetry} className="btn-ink mt-5">Try again</button>
    </div>
  );
}
