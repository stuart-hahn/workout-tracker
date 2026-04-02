import Link from "next/link";
import { requireUser } from "@/lib/auth/requireUser";
import { prisma } from "@/lib/db";

function utcDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatHeading(isoDate: string): string {
  const [y, m, day] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, day));
  return dt.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function HistoryPage() {
  const user = await requireUser();

  const workouts = await prisma.workoutInstance.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: 50,
    include: { workoutDay: true },
  });

  const byDate = new Map<string, typeof workouts>();
  for (const w of workouts) {
    const key = utcDateKey(w.date);
    const arr = byDate.get(key) ?? [];
    arr.push(w);
    byDate.set(key, arr);
  }

  const dateKeys = [...byDate.keys()].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-semibold tracking-tight">History</h1>
          <Link
            href="/today"
            className="text-sm font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-50"
          >
            Today
          </Link>
        </div>
        <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          Recent sessions, newest first. Open any entry to review or edit logs.
        </p>
      </section>

      {dateKeys.length === 0 ? (
        <p className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
          No workouts logged yet. Start one from Today.
        </p>
      ) : (
        dateKeys.map((key) => (
          <section
            key={key}
            className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5"
          >
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {formatHeading(key)}
            </h2>
            <ul className="mt-3 space-y-2">
              {(byDate.get(key) ?? []).map((w) => (
                <li key={w.id}>
                  <Link
                    href={`/workouts/${w.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/10"
                  >
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      {w.workoutDay.name}
                    </span>
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">
                      {w.status.replace("_", " ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
