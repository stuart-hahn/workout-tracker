"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";

const ACTIVE_WORKOUT_CACHE_MS = 30_000;

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
    "min-h-11 min-w-0 rounded-lg px-1 py-2.5 text-center text-xs font-medium leading-tight outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 sm:px-2.5 sm:text-xs dark:focus-visible:ring-offset-zinc-950";
  if (active) {
    return `${base} bg-zinc-100 text-zinc-900 dark:bg-white/10 dark:text-zinc-50`;
  }
  return `${base} text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/10`;
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const activeFetchCacheRef = useRef<{ id: string | null; at: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const cached = activeFetchCacheRef.current;
    const now = Date.now();
    if (cached != null && now - cached.at < ACTIVE_WORKOUT_CACHE_MS) {
      setActiveWorkoutId(cached.id);
      return () => {
        cancelled = true;
      };
    }

    async function run() {
      const res = await fetch("/api/workouts/active", { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as
        | { workoutInstanceId?: string | null }
        | null;
      if (cancelled) return;
      const id = data?.workoutInstanceId;
      const nextId = typeof id === "string" && id ? id : null;
      setActiveWorkoutId(nextId);
      activeFetchCacheRef.current = { id: nextId, at: Date.now() };
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const workoutIdOnPage = useMemo(() => {
    const m = pathname.match(/^\/workouts\/([^/]+)/);
    return m?.[1] ?? null;
  }, [pathname]);

  /** Prefer current workout URL when already on a session; otherwise resume today’s in-progress instance. */
  const logHref =
    workoutIdOnPage != null
      ? `/workouts/${workoutIdOnPage}`
      : activeWorkoutId != null
        ? `/workouts/${activeWorkoutId}`
        : "/today";

  const logPillActive = pathname === "/today" || pathname.startsWith("/workouts/");

  return (
    <div className="flex min-h-full flex-col overflow-x-hidden bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <a
        href="#main-content"
        className="pointer-events-none fixed left-4 top-4 z-[100] -translate-y-24 opacity-0 focus:pointer-events-auto focus:translate-y-0 focus:opacity-100 focus:rounded-lg focus:bg-zinc-900 focus:px-4 focus:py-2 focus:text-sm focus:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:bg-white dark:focus:text-black"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-10 border-b border-zinc-200/70 bg-zinc-50/90 backdrop-blur dark:border-white/10 dark:bg-black/70">
        <div className="mx-auto flex w-full min-w-0 max-w-md items-center justify-between gap-2 px-4 py-3">
          <Link
            href="/"
            className="text-base font-semibold tracking-tight text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:text-zinc-50 dark:focus-visible:ring-offset-zinc-950"
          >
            Workout Tracker
          </Link>
          <Link
            href={logHref}
            aria-current={pathname === logHref ? "page" : undefined}
            className={[
              "rounded-full px-3 py-1.5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950",
              logPillActive
                ? "bg-zinc-200 text-zinc-900 dark:bg-white/20 dark:text-zinc-50"
                : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200",
            ].join(" ")}
          >
            Log
          </Link>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full min-w-0 max-w-md flex-1 scroll-mt-16 px-4 py-4 outline-none"
      >
        {children}
      </main>

      <nav
        aria-label="Primary"
        className="sticky bottom-0 z-10 border-t border-zinc-200/70 bg-zinc-50/90 backdrop-blur pb-[env(safe-area-inset-bottom)] dark:border-white/10 dark:bg-black/70"
      >
        <div className="mx-auto grid w-full min-w-0 max-w-md grid-cols-5 gap-0.5 px-0.5 py-2 sm:gap-1 sm:px-1">
          {bottomNav.map((item) => {
            const itemHref = item.href === "/today" ? logHref : item.href;
            const isToday = item.href === "/today";
            const todayTabVisualActive =
              isToday && (pathname === "/today" || pathname.startsWith("/workouts/"));
            const active =
              item.href === "/"
                ? pathname === "/"
                : isToday
                  ? todayTabVisualActive
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const ariaCurrent =
              isToday && pathname === itemHref ? "page" : !isToday && active ? "page" : undefined;

            return (
              <Link
                key={item.href}
                href={itemHref}
                aria-current={ariaCurrent}
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
