import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { absolute: "Page not found · Workout Tracker" },
};

const linkClass =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 outline-none hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:border-white/10 dark:bg-transparent dark:text-zinc-50 dark:hover:bg-white/10 dark:focus-visible:ring-offset-zinc-950";

export default function NotFound() {
  return (
    <div className="flex min-w-0 flex-col gap-4 py-2">
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Page not found</h1>
      <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
        That link doesn&apos;t match anything in this app.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link href="/" className={linkClass}>
          Home
        </Link>
        <Link href="/today" className={linkClass}>
          Today
        </Link>
      </div>
    </div>
  );
}
