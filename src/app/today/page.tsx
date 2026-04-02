import Link from "next/link";
import { requireUser } from "@/lib/auth/requireUser";
import { prisma } from "@/lib/db";
import StartWorkout from "./ui";

export default async function TodayPage() {
  await requireUser();

  const program = await prisma.program.findFirst({
    where: { active: true },
    include: { workoutDays: { orderBy: { order: "asc" } } },
  });

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
        <h1 className="text-lg font-semibold tracking-tight">Today</h1>
        <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          Pick a day and start logging. We’ll pre-create your sets so you can
          enter reps/weight fast.
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Start a workout
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {program?.workoutDays.map((d) => (
            <StartWorkout key={d.id} workoutDayId={d.id} label={d.name} />
          )) ?? (
            <p className="col-span-2 text-sm text-zinc-600 dark:text-zinc-300">
              No active program found. Seed sample data or create a program.
            </p>
          )}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/program"
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-white/10 dark:bg-transparent dark:text-zinc-50 dark:hover:bg-white/10"
        >
          View program
        </Link>
        <Link
          href="/analytics/volume"
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-white/10 dark:bg-transparent dark:text-zinc-50 dark:hover:bg-white/10"
        >
          Weekly volume
        </Link>
      </div>
    </div>
  );
}

