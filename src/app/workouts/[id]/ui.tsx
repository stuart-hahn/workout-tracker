"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { formatLastSessionRepsPerSet } from "@/lib/workouts/lastSessionCopy";

type ApiWorkout = {
  id: string;
  status: string;
  date: string;
  workoutDay: {
    name: string;
    notes: string | null;
    exercises: Array<{
      id: string;
      name: string;
      notes: string | null;
      restSeconds: number | null;
      repRangeMin: number;
      repRangeMax: number;
      setCount: number;
      movementType: string;
      assistanceMode: string;
      isBodyweight: boolean;
    }>;
  };
  setLogs: Array<{
    id: string;
    exerciseId: string;
    setNumber: number;
    targetRepMin: number | null;
    targetRepMax: number | null;
    lastSessionRepMin: number | null;
    lastSessionRepMax: number | null;
    lastSessionWorkingWeight: number | null;
    weightExplanation: string | null;
    targetWeight: number | null;
    reps: number | null;
    weight: number | null;
    rir: number | null;
    completed: boolean;
  }>;
};

function repsToInput(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "";
  return String(v);
}

export default function WorkoutLogger(props: {
  workoutInstanceId: string;
  /** When false, day name / notes are shown by the parent page. Default true. */
  showDayHeader?: boolean;
}) {
  const showDayHeader = props.showDayHeader !== false;
  const router = useRouter();
  const [workout, setWorkout] = useState<ApiWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch(`/api/workouts/${props.workoutInstanceId}`, {
        cache: "no-store",
      });
      const data = (await res.json().catch(() => null)) as
        | { workout?: ApiWorkout; error?: string }
        | null;
      setWorkout(data?.workout ?? null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.workoutInstanceId]);

  const logsByExercise = useMemo(() => {
    const map = new Map<string, ApiWorkout["setLogs"]>();
    for (const l of workout?.setLogs ?? []) {
      const arr = map.get(l.exerciseId) ?? [];
      arr.push(l);
      map.set(l.exerciseId, arr);
    }
    return map;
  }, [workout?.setLogs]);

  async function saveSet(input: {
    exerciseId: string;
    setNumber: number;
    reps: number | null;
    weight: number | null;
    rir: number | null;
    completed: boolean;
  }) {
    await fetch("/api/logs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        workoutInstanceId: props.workoutInstanceId,
        ...input,
      }),
    });
    await refresh();
  }

  async function finishWorkout() {
    setFinishing(true);
    try {
      const res = await fetch(`/api/workouts/${props.workoutInstanceId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (!res.ok) return;
      await refresh();
      router.push("/history");
    } finally {
      setFinishing(false);
    }
  }

  async function deleteWorkout(workoutName: string) {
    const ok = window.confirm(
      `Delete “${workoutName}”? All logged sets for this session will be removed. This cannot be undone.`,
    );
    if (!ok) return;

    setDeleteError(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/workouts/${props.workoutInstanceId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/history");
        return;
      }
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setDeleteError(data?.error ?? "Could not delete workout.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading && !workout) {
    return <Card className="text-sm text-zinc-700 dark:text-zinc-200">Loading…</Card>;
  }

  if (!workout) {
    return <Card className="text-sm text-zinc-700 dark:text-zinc-200">Workout not found.</Card>;
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {workout.status === "IN_PROGRESS" ? (
        <Card>
          <button
            type="button"
            disabled={finishing || deleting}
            onClick={() => void finishWorkout()}
            className="h-10 w-full rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white outline-none hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 disabled:opacity-60 dark:focus-visible:ring-offset-zinc-950 sm:w-auto"
          >
            {finishing ? "Saving…" : "Finish workout"}
          </button>
          <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
            Marks this session completed so history stays tidy. You can still open it later to review.
          </p>
        </Card>
      ) : null}

      {showDayHeader ? (
        <Card>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {workout.workoutDay.name}
          </h2>
          {workout.workoutDay.notes ? (
            <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              {workout.workoutDay.notes}
            </p>
          ) : null}
        </Card>
      ) : null}

      {workout.workoutDay.exercises.map((ex) => {
        const logs = (logsByExercise.get(ex.id) ?? []).sort(
          (a, b) => a.setNumber - b.setNumber,
        );

        const first = logs[0];
        const low = first?.targetRepMin ?? ex.repRangeMin;
        const high = first?.targetRepMax ?? ex.repRangeMax;
        const lastLo = first?.lastSessionRepMin;
        const lastHi = first?.lastSessionRepMax;
        const hasLast =
          lastLo != null &&
          lastHi != null &&
          Number.isFinite(lastLo) &&
          Number.isFinite(lastHi);

        const weightNote =
          first?.targetWeight != null && first.targetWeight < 0
            ? "Assisted: negative weight is help subtracted from bodyweight."
            : ex.isBodyweight
              ? "Bodyweight: log extra load as weight if you add it."
              : null;

        return (
          <Card key={ex.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {ex.name}
                </h3>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                  {ex.setCount} sets · {ex.repRangeMin}–{ex.repRangeMax} reps
                  {ex.restSeconds ? ` · Rest ${ex.restSeconds}s` : ""}
                </p>
              </div>
            </div>

            <ProgressionHint exerciseId={ex.id} />

            {first?.targetWeight != null || first?.targetRepMin != null ? (
              <div className="mt-2 space-y-1 text-xs leading-5 text-zinc-600 dark:text-zinc-300">
                <p>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                    Suggested reps:
                  </span>{" "}
                  {low}–{high}
                  {hasLast ? (
                    <>
                      . Last session: {formatLastSessionRepsPerSet(lastLo, lastHi)};
                      try to beat that up to {high}.
                    </>
                  ) : null}
                </p>
                {first?.targetWeight != null ? (
                  <div className="space-y-1">
                    <p>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                        Suggested weight:
                      </span>{" "}
                      {first.targetWeight}{" "}
                      {weightNote ? <span className="text-zinc-500">({weightNote})</span> : null}
                    </p>
                    {first.weightExplanation ? (
                      <p className="text-zinc-600 dark:text-zinc-400">{first.weightExplanation}</p>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                        Weight:
                      </span>{" "}
                      Choose a load to match the rep range.
                      {weightNote ? (
                        <span className="text-zinc-500"> {weightNote}</span>
                      ) : null}
                    </p>
                    {first.weightExplanation ? (
                      <p className="text-zinc-600 dark:text-zinc-400">{first.weightExplanation}</p>
                    ) : null}
                  </div>
                )}
              </div>
            ) : null}

            {ex.notes ? (
              <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-200">
                {ex.notes}
              </p>
            ) : null}

            <div className="mt-3 flex flex-col gap-2">
              {logs.map((l) => (
                <SetRow
                  key={l.id}
                  setNumber={l.setNumber}
                  targetWeight={l.targetWeight}
                  reps={l.reps}
                  weight={l.weight}
                  rir={l.rir}
                  completed={l.completed}
                  onChange={(next) =>
                    saveSet({
                      exerciseId: ex.id,
                      setNumber: l.setNumber,
                      ...next,
                    })
                  }
                />
              ))}
            </div>
          </Card>
        );
      })}

      <Card className="border-red-200/80 dark:border-red-900/40">
        <details className="group">
          <summary className="cursor-pointer list-none text-sm font-medium text-zinc-800 outline-none marker:content-none dark:text-zinc-200 [&::-webkit-details-marker]:hidden">
            <span className="underline decoration-zinc-400 underline-offset-2 group-open:no-underline">
              Advanced
            </span>
            <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-400">
              Remove session from history
            </span>
          </summary>
          <p className="mt-3 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
            Delete if you started the wrong day or want to discard this workout and all its logs.
          </p>
          <button
            type="button"
            disabled={finishing || deleting}
            onClick={() => void deleteWorkout(workout.workoutDay.name)}
            className="mt-3 h-10 w-full rounded-xl border border-red-300 bg-white px-4 text-sm font-medium text-red-700 outline-none hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 disabled:opacity-60 dark:border-red-800 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-950/40 dark:focus-visible:ring-offset-zinc-950 sm:w-auto"
          >
            {deleting ? "Deleting…" : "Delete workout"}
          </button>
          {deleteError ? (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">{deleteError}</p>
          ) : null}
        </details>
      </Card>
    </div>
  );
}

function ProgressionHint(props: { exerciseId: string }) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const res = await fetch(
        `/api/progression/recommendation?exerciseId=${encodeURIComponent(props.exerciseId)}`,
        { cache: "no-store" },
      );
      const data = (await res.json().catch(() => null)) as
        | {
            targets?: {
              rationale?: string;
              targetRepMin?: number;
              targetRepMax?: number;
            };
            effortHint?: string;
          }
        | null;

      const msg = data?.targets?.rationale ?? "";
      const effort = data?.effortHint ?? "";
      if (!cancelled) setText([msg, effort].filter(Boolean).join(" "));
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [props.exerciseId]);

  if (!text) return null;
  return (
    <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-300">
      <span className="font-semibold text-zinc-900 dark:text-zinc-50">
        Progression:
      </span>{" "}
      {text}
    </p>
  );
}

function SetRow(props: {
  setNumber: number;
  targetWeight: number | null;
  reps: number | null;
  weight: number | null;
  rir: number | null;
  completed: boolean;
  onChange: (next: {
    reps: number | null;
    weight: number | null;
    rir: number | null;
    completed: boolean;
  }) => void;
}) {
  const initialWeight =
    props.weight ?? (props.targetWeight !== null ? props.targetWeight : null);

  const [reps, setReps] = useState(() => repsToInput(props.reps));
  const [weight, setWeight] = useState(
    initialWeight != null && Number.isFinite(initialWeight) ? String(initialWeight) : "",
  );
  const [rir, setRir] = useState(props.rir?.toString() ?? "");
  const [completed, setCompleted] = useState(props.completed);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setReps(repsToInput(props.reps));
    const nextWeight =
      props.weight ?? (props.targetWeight !== null ? props.targetWeight : null);
    setWeight(
      nextWeight != null && Number.isFinite(nextWeight) ? String(nextWeight) : "",
    );
    setRir(props.rir?.toString() ?? "");
    setCompleted(props.completed);
  }, [
    props.completed,
    props.reps,
    props.rir,
    props.targetWeight,
    props.weight,
  ]);

  async function save(nextCompleted: boolean) {
    setSaving(true);
    try {
      const repsTrim = reps.trim();
      const repsNum = repsTrim === "" ? null : Number(repsTrim);

      const weightTrim = weight.trim();
      const weightNum = weightTrim === "" ? null : Number(weightTrim);

      const rirTrim = rir.trim();
      const rirNum = rirTrim === "" ? null : Number(rirTrim);

      props.onChange({
        reps: repsNum !== null && Number.isFinite(repsNum) ? repsNum : null,
        weight: weightNum !== null && Number.isFinite(weightNum) ? weightNum : null,
        rir: rirNum !== null && Number.isFinite(rirNum) ? rirNum : null,
        completed: nextCompleted,
      });
    } finally {
      setSaving(false);
    }
  }

  const markButtonClass = completed
    ? "h-9 w-full shrink-0 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60 sm:ml-auto sm:w-auto"
    : "h-9 w-full shrink-0 rounded-lg bg-zinc-900 px-3 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200 sm:ml-auto sm:w-auto";

  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-zinc-200 p-2 dark:border-white/10 sm:flex-row sm:items-center sm:gap-2">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <div className="w-10 shrink-0 text-center text-xs font-semibold text-zinc-700 dark:text-zinc-200">
          Set {props.setNumber}
        </div>
        <input
          inputMode="numeric"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          placeholder="Reps"
          className="h-9 min-w-0 flex-1 basis-[4.5rem] rounded-lg border border-zinc-200 bg-white px-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-white/10 dark:bg-black/20 dark:text-zinc-50 dark:focus:border-white/30 sm:w-16 sm:flex-none sm:basis-auto"
        />
        <input
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="Wt"
          className="h-9 min-w-0 flex-1 basis-[5rem] rounded-lg border border-zinc-200 bg-white px-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-white/10 dark:bg-black/20 dark:text-zinc-50 dark:focus:border-white/30 sm:w-20 sm:flex-none sm:basis-auto"
        />
        <input
          inputMode="numeric"
          value={rir}
          onChange={(e) => setRir(e.target.value)}
          placeholder="RIR"
          className="h-9 min-w-0 flex-1 basis-[4.5rem] rounded-lg border border-zinc-200 bg-white px-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-white/10 dark:bg-black/20 dark:text-zinc-50 dark:focus:border-white/30 sm:w-16 sm:flex-none sm:basis-auto"
        />
      </div>
      <button
        type="button"
        disabled={saving}
        onClick={() => {
          const next = !completed;
          setCompleted(next);
          void save(next);
        }}
        className={markButtonClass}
      >
        {saving ? "…" : completed ? "Done" : "Mark"}
      </button>
    </div>
  );
}
