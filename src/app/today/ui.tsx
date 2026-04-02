"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function StartWorkout(props: {
  workoutDayId: string;
  label: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    try {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workoutDayId: props.workoutDayId, date: new Date().toISOString() }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; workoutInstanceId?: string; error?: string }
        | null;

      if (!res.ok || !data?.ok || !data.workoutInstanceId) {
        return;
      }

      router.push(`/workouts/${data.workoutInstanceId}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={start}
      className="h-11 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
    >
      {busy ? "Starting…" : props.label}
    </button>
  );
}

