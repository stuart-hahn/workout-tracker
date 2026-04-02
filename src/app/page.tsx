import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageIntro } from "@/components/ui/page-intro";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { endOfUtcDayExclusive, startOfUtcDay } from "@/lib/dates/utcDay";

export const metadata: Metadata = {
  title: { absolute: "Workout Tracker" },
};

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950";
const primaryLink = `w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-zinc-800 sm:flex-1 dark:bg-white dark:text-black dark:hover:bg-zinc-200 ${focusRing}`;
const secondaryLink = `w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-900 hover:bg-zinc-50 sm:flex-1 dark:border-white/10 dark:bg-transparent dark:text-zinc-50 dark:hover:bg-white/10 ${focusRing}`;

export default async function Home() {
  const user = await getCurrentUser();

  const inProgressToday =
    user != null
      ? await prisma.workoutInstance.findFirst({
          where: {
            userId: user.id,
            status: "IN_PROGRESS",
            date: {
              gte: startOfUtcDay(new Date()),
              lt: endOfUtcDayExclusive(new Date()),
            },
          },
          include: { workoutDay: true },
          orderBy: { updatedAt: "desc" },
        })
      : null;

  return (
    <div className="flex min-w-0 flex-col gap-4 pb-2">
      <PageIntro
        title="Your training, simplified."
        description="Log sets fast, follow double progression, and see weekly volume by muscle group."
      />

      <Card>
        {inProgressToday ? (
          <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-300">
            <span className="font-medium text-zinc-900 dark:text-zinc-50">In progress:</span>{" "}
            {inProgressToday.workoutDay.name}
          </p>
        ) : null}
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:gap-2">
          {inProgressToday ? (
            <>
              <Link href={`/workouts/${inProgressToday.id}`} className={primaryLink}>
                Resume workout
              </Link>
              <Link href="/today" className={secondaryLink}>
                Start today’s workout
              </Link>
            </>
          ) : (
            <Link href="/today" className={primaryLink}>
              Start today’s workout
            </Link>
          )}
          <Link href="/program" className={secondaryLink}>
            Program
          </Link>
          <Link href="/history" className={secondaryLink}>
            History
          </Link>
        </div>
      </Card>

      {user ? (
        <Card>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Account</h2>
          <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">
            Signed in as{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-50">{user.email}</span>
          </p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
              Use <span className="font-medium">Today</span> to start a session and log sets.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
              Check <span className="font-medium">Volume</span> for weekly muscle-group totals.
            </li>
          </ul>
          <div className="mt-4">
            <Link
              href="/logout"
              className={`inline-flex w-full items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-white/10 dark:bg-transparent dark:text-zinc-50 dark:hover:bg-white/10 sm:w-auto ${focusRing}`}
            >
              Log out
            </Link>
          </div>
        </Card>
      ) : (
        <Card>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Next steps</h2>
          <ul className="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
              Create an account to save your program and logs.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
              After signing in, run <code className="text-xs">npm run db:seed</code> locally to load
              demo data (optional).
            </li>
          </ul>
          <div className="mt-4 flex min-w-0 flex-col gap-2 sm:flex-row sm:gap-2">
            <Link href="/register" className={secondaryLink}>
              Register
            </Link>
            <Link href="/login" className={secondaryLink}>
              Login
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
