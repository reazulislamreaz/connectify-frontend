"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RequireAdmin } from "./RequireAdmin";
import { ADMIN_USE_MOCK } from "@/hooks/adminQueries";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/health", label: "Health" },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

/**
 * Full-width admin chrome: app Sidebar + a sticky sub-nav of admin sections.
 * Wide tables need the full width, so this deliberately avoids the centered
 * DesktopContentLayout used by the social pages.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <ProtectedRoute>
      <RequireAdmin>
        <div className="flex h-[100dvh] bg-slate-100">
          <Sidebar />
          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pb-[4.25rem] md:pb-0">
            <header className="shrink-0 border-b border-surface-border bg-white/95 px-4 pt-3 backdrop-blur-md sm:px-6 lg:px-8">
              <div className="flex items-center justify-between gap-3">
                <h1 className="text-lg font-bold text-slate-900 lg:text-xl">
                  Admin
                </h1>
                {ADMIN_USE_MOCK && (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                    Demo data
                  </span>
                )}
              </div>
              <nav className="-mb-px mt-2 flex gap-1 overflow-x-auto">
                {TABS.map((tab) => {
                  const active = isActive(pathname, tab.href);
                  return (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      className={cn(
                        "shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition",
                        active
                          ? "border-brand-500 text-brand-700"
                          : "border-transparent text-slate-500 hover:text-slate-800",
                      )}
                    >
                      {tab.label}
                    </Link>
                  );
                })}
              </nav>
            </header>
            <div className="scrollbar-thin flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
              <div className="mx-auto w-full max-w-6xl space-y-4 lg:space-y-5">
                {children}
              </div>
            </div>
          </main>
        </div>
      </RequireAdmin>
    </ProtectedRoute>
  );
}
