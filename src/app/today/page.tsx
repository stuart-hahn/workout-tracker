import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageIntro } from "@/components/ui/page-intro";
import { requireUser } from "@/lib/auth/requireUser";
import { prisma } from "@/lib/db";
import { endOfUtcDayExclusive, startOfUtcDay } from "@/lib/dates/utcDay";
import StartWorkout from "./ui";

const quickLink =
  "rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-white/10 dark:bg-transparent dark:text-zinc-50 dark:hover:bg-white/10";

export default async function TodayPage() {
  const user = await requireUser();

  const now = new Date();
  const dayStart = startOfUtcDay(now);
  const dayEnd = endOfUtcDayExclusive(now);

  const [program, inProgressToday] = await Promise.all([
    prisma.program.findFirst({
      where: { userId: user.id, active: true },
      include: { workoutDays: { orderBy: { order: "asc" } } },
    }),
    prisma.workoutInstance.findMany({
      where: {
        userId: user.id,
        status: "IN_PROGRESS",
        date: { gte: dayStart, lt: dayEnd },
      },
      include: { workoutDay: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const continueByDayId = new Map(
    inProgressToday.map((w) => [w.workoutDayId, w.id] as const),
  );

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageIntro
        title="Today"
        description="Pick a day and start logging. We’ll pre-create your sets so you can enter reps/weight fast."
      />

      <Card>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Start a workout</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {program?.workoutDays.map((d) => (
            <StartWorkout
              key={d.id}
              workoutDayId={d.id}
              label={d.name}
              continueWorkoutId={continueByDayId.get(d.id) ?? null}
            />
          )) ?? (
            <p className="col-span-2 text-sm text-zinc-600 dark:text-zinc-300">
              No active program found. Seed sample data or create a program.
            </p>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Link href="/program" className={quickLink}>
          View program
        </Link>
        <Link href="/history" className={quickLink}>
          History
        </Link>
        <Link href="/analytics/volume" className={`col-span-2 ${quickLink}`}>
          Weekly volume
        </Link>
      </div>
    </div>
  );
}
