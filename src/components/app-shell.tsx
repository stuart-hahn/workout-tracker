"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavItem = { href: string; label: string };

const bottomNav: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/today", label: "Today" },
  { href: "/history", label: "History" },
  { href: "/program", label: "Program" },
  { href: "/analytics/volume", label: "Volume" },
];

function navLinkClass(active: boolean) {
  const base =
    "rounded-lg px-1.5 py-2 text-center text-[10px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 sm:px-2.5 sm:text-xs dark:focus-visible:ring-offset-zinc-950";
  if (active) {
    return `${base} bg-zinc-100 text-zinc-900 dark:bg-white/10 dark:text-zinc-50`;
  }
  return `${base} text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/10`;
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-full flex-col overflow-x-hidden bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-200/70 bg-zinc-50/90 backdrop-blur dark:border-white/10 dark:bg-black/70">
        <div className="mx-auto flex w-full min-w-0 max-w-md items-center justify-between gap-2 px-4 py-3">
          <Link
            href="/"
            className="text-base font-semibold tracking-tight text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:text-zinc-50 dark:focus-visible:ring-offset-zinc-950"
          >
            Workout Tracker
          </Link>
          <Link
            href="/today"
            aria-current={pathname === "/today" ? "page" : undefined}
            className={[
              "rounded-full px-3 py-1.5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950",
              pathname === "/today"
                ? "bg-zinc-200 text-zinc-900 dark:bg-white/20 dark:text-zinc-50"
                : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200",
            ].join(" ")}
          >
            Log
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full min-w-0 max-w-md flex-1 px-4 py-4">{children}</main>

      <nav
        aria-label="Primary"
        className="sticky bottom-0 z-10 border-t border-zinc-200/70 bg-zinc-50/90 backdrop-blur pb-[env(safe-area-inset-bottom)] dark:border-white/10 dark:bg-black/70"
      >
        <div className="mx-auto grid w-full min-w-0 max-w-md grid-cols-5 gap-0.5 px-0.5 py-2 sm:gap-1 sm:px-1">
          {bottomNav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={navLinkClass(active)}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
