"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const btnClass =
  "flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white outline-none hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950";

export default function StartWorkout(props: {
  workoutDayId: string;
  label: string;
  continueWorkoutId?: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const continueId = props.continueWorkoutId ?? null;

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workoutDayId: props.workoutDayId, date: new Date().toISOString() }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; workoutInstanceId?: string; resumed?: boolean; error?: string }
        | null;

      if (!res.ok || !data?.ok || !data.workoutInstanceId) {
        setError(data?.error ?? "Could not start workout. Try again.");
        return;
      }

      router.push(`/workouts/${data.workoutInstanceId}`);
    } finally {
      setBusy(false);
    }
  }

  if (continueId) {
    return (
      <Link href={`/workouts/${continueId}`} className={btnClass}>
        Continue · {props.label}
      </Link>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <button type="button" disabled={busy} onClick={() => void start()} className={btnClass}>
        {busy ? "Starting…" : props.label}
      </button>
      {error ? (
        <p className="text-center text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

