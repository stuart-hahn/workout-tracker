import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-w-0 flex-col gap-4 pb-2">
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
        <h1 className="text-lg font-semibold tracking-tight">
          Your training, simplified.
        </h1>
        <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          Log sets fast, follow double progression, and see weekly volume by
          muscle group.
        </p>
        <div className="mt-4 flex min-w-0 flex-col gap-2 sm:flex-row sm:gap-2">
          <Link
            href="/today"
            className="w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-zinc-800 sm:flex-1 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Start today’s workout
          </Link>
          <Link
            href="/program"
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-900 hover:bg-zinc-50 sm:flex-1 dark:border-white/10 dark:bg-transparent dark:text-zinc-50 dark:hover:bg-white/10"
          >
            Edit program
          </Link>
          <Link
            href="/history"
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-900 hover:bg-zinc-50 sm:flex-1 dark:border-white/10 dark:bg-transparent dark:text-zinc-50 dark:hover:bg-white/10"
          >
            History
          </Link>
        </div>
      </section>

      {user ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Account
          </h2>
          <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">
            Signed in as{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              {user.email}
            </span>
          </p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
              Use <span className="font-medium">Today</span> to start a session
              and log sets.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
              Check <span className="font-medium">Volume</span> for weekly
              muscle-group totals.
            </li>
          </ul>
          <div className="mt-4">
            <Link
              href="/logout"
              className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-white/10 dark:bg-transparent dark:text-zinc-50 dark:hover:bg-white/10 sm:w-auto"
            >
              Log out
            </Link>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Next steps
          </h2>
          <ul className="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
              Create an account to save your program and logs.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
              After signing in, run <code className="text-xs">npm run db:seed</code>{" "}
              locally to load demo data (optional).
            </li>
          </ul>
          <div className="mt-4 flex min-w-0 flex-col gap-2 sm:flex-row sm:gap-2">
            <Link
              href="/register"
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-900 hover:bg-zinc-50 sm:flex-1 dark:border-white/10 dark:bg-transparent dark:text-zinc-50 dark:hover:bg-white/10"
            >
              Register
            </Link>
            <Link
              href="/login"
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-900 hover:bg-zinc-50 sm:flex-1 dark:border-white/10 dark:bg-transparent dark:text-zinc-50 dark:hover:bg-white/10"
            >
              Login
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
