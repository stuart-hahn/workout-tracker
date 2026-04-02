import Link from "next/link";
import { requireUser } from "@/lib/auth/requireUser";
import WorkoutLogger from "./ui";

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold tracking-tight">Workout</h1>
          <Link
            href="/today"
            className="text-sm font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-50"
          >
            Back
          </Link>
        </div>
        <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          Log your sets. Mark a set complete when you hit your target effort.
        </p>
      </section>

      <WorkoutLogger workoutInstanceId={id} />
    </div>
  );
}

