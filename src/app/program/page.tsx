import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/requireUser";
import { Card } from "@/components/ui/card";
import { PageIntro } from "@/components/ui/page-intro";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Program",
};

export default async function ProgramPage() {
  const user = await requireUser();

  const program = await prisma.program.findFirst({
    where: { userId: user.id, active: true },
    include: {
      workoutDays: {
        orderBy: { order: "asc" },
        include: {
          exercises: { orderBy: { name: "asc" } },
        },
      },
    },
  });

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageIntro
        title="Program"
        description={
          <>
            Your active training split and exercises. Editing sets, rep ranges, and notes in the app is
            not available yet—this view stays in sync with your saved program.
          </>
        }
      />

      {!program ? (
        <Card>
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            No active program found. Seed sample data locally with{" "}
            <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-white/10">
              npm run db:seed
            </code>{" "}
            or add a program via the database.
          </p>
        </Card>
      ) : (
        <>
          <Card>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{program.name}</h2>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              {program.workoutDays.length} training day
              {program.workoutDays.length === 1 ? "" : "s"}
            </p>
          </Card>

          {program.workoutDays.map((day) => (
            <Card key={day.id}>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{day.name}</h3>
              {day.notes ? (
                <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{day.notes}</p>
              ) : null}
              <ul className="mt-3 space-y-2">
                {day.exercises.map((ex) => (
                  <li
                    key={ex.id}
                    className="rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-white/10"
                  >
                    <div className="font-medium text-zinc-900 dark:text-zinc-50">{ex.name}</div>
                    <div className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                      {ex.setCount} sets · {ex.repRangeMin}–{ex.repRangeMax} reps
                      {ex.restSeconds != null ? ` · ${ex.restSeconds}s rest` : ""}
                      {ex.isBodyweight ? " · Bodyweight" : ""}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
