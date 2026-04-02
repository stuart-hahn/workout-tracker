"use client";

import { useEffect, useMemo, useState } from "react";

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
    }>;
  };
  setLogs: Array<{
    id: string;
    exerciseId: string;
    setNumber: number;
    targetReps: number | null;
    targetWeight: number | null;
    reps: number | null;
    weight: number | null;
    rir: number | null;
    completed: boolean;
  }>;
};

export default function WorkoutLogger(props: { workoutInstanceId: string }) {
  const [workout, setWorkout] = useState<ApiWorkout | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading && !workout) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
        Loading…
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
        Workout not found.
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {workout.workoutDay.name}
        </h2>
        {workout.workoutDay.notes ? (
          <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            {workout.workoutDay.notes}
          </p>
        ) : null}
      </section>

      {workout.workoutDay.exercises.map((ex) => {
        const logs = (logsByExercise.get(ex.id) ?? []).sort(
          (a, b) => a.setNumber - b.setNumber,
        );

        const first = logs[0];
        return (
          <section
            key={ex.id}
            className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5"
          >
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

            {first?.targetReps || first?.targetWeight ? (
              <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-300">
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                  Suggested:
                </span>{" "}
                {first.targetWeight !== null ? `${first.targetWeight} wt` : "Choose weight"} · Aim{" "}
                {first.targetReps ?? ex.repRangeMin} reps
              </p>
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
                  targetReps={l.targetReps}
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
          </section>
        );
      })}
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
        | { targets?: { rationale?: string }; effortHint?: string }
        | null;

      const msg = data?.targets?.rationale ?? null;
      const effort = data?.effortHint ?? null;
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
  targetReps: number | null;
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
  const initialReps =
    props.reps ?? (props.targetReps !== null ? props.targetReps : null);
  const initialWeight =
    props.weight ?? (props.targetWeight !== null ? props.targetWeight : null);

  const [reps, setReps] = useState(initialReps?.toString() ?? "");
  const [weight, setWeight] = useState(initialWeight?.toString() ?? "");
  const [rir, setRir] = useState(props.rir?.toString() ?? "");
  const [completed, setCompleted] = useState(props.completed);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const nextReps = props.reps ?? props.targetReps ?? null;
    const nextWeight = props.weight ?? props.targetWeight ?? null;
    setReps(nextReps?.toString() ?? "");
    setWeight(nextWeight?.toString() ?? "");
    setRir(props.rir?.toString() ?? "");
    setCompleted(props.completed);
  }, [
    props.completed,
    props.reps,
    props.rir,
    props.targetReps,
    props.targetWeight,
    props.weight,
  ]);

  async function save(nextCompleted: boolean) {
    setSaving(true);
    try {
      const repsNum = reps.trim() ? Number(reps) : null;
      const weightNum = weight.trim() ? Number(weight) : null;
      const rirNum = rir.trim() ? Number(rir) : null;

      props.onChange({
        reps: repsNum && Number.isFinite(repsNum) ? repsNum : null,
        weight: weightNum && Number.isFinite(weightNum) ? weightNum : null,
        rir: rirNum && Number.isFinite(rirNum) ? rirNum : null,
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

