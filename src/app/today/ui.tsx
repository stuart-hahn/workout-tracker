"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const btnClass =
  "flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200";

export default function StartWorkout(props: {
  workoutDayId: string;
  label: string;
  continueWorkoutId?: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const continueId = props.continueWorkoutId ?? null;

  async function start() {
    setBusy(true);
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
    <button type="button" disabled={busy} onClick={() => void start()} className={btnClass}>
      {busy ? "Starting…" : props.label}
    </button>
  );
}

