"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Card } from "@/components/ui/card";
import { formatLastSessionRepsPerSet } from "@/lib/workouts/lastSessionCopy";

type WeightUnit = "LB" | "KG";

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

type SetLogRow = ApiWorkout["setLogs"][number];

type RestTimerState = {
  total: number;
  left: number;
  paused: boolean;
  exerciseName: string;
};

const inputFocusClass =
  "h-9 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:border-white/10 dark:bg-black/20 dark:text-zinc-50 dark:focus:border-white/30 dark:focus-visible:ring-offset-zinc-950";

function repsToInput(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "";
  return String(v);
}

function unitShort(u: WeightUnit): string {
  return u === "KG" ? "kg" : "lb";
}

function mergeSetLogIntoWorkout(prev: ApiWorkout, row: SetLogRow): ApiWorkout {
  return {
    ...prev,
    setLogs: prev.setLogs.map((l) =>
      l.exerciseId === row.exerciseId && l.setNumber === row.setNumber ? { ...l, ...row } : l,
    ),
  };
}

function RestTimerStrip(props: {
  state: RestTimerState;
  onDismiss: () => void;
  onTogglePause: () => void;
}) {
  const { state, onDismiss, onTogglePause } = props;
  const [liveLine, setLiveLine] = useState(
    () =>
      state.left > 0
        ? `Rest ${state.left} seconds remaining for ${state.exerciseName}.`
        : "",
  );

  useEffect(() => {
    if (state.left <= 0) {
      setLiveLine("Rest complete.");
      return;
    }
    if (
      state.left === state.total ||
      state.left % 15 === 0 ||
      state.left <= 5
    ) {
      setLiveLine(
        `Rest ${state.left} seconds remaining for ${state.exerciseName}.`,
      );
    }
  }, [state.left, state.total, state.exerciseName]);

  return (
    <Card className="border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/30">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
            Rest · {state.exerciseName}
          </p>
          <p
            className="mt-0.5 font-mono text-2xl font-bold tabular-nums text-emerald-800 dark:text-emerald-200 motion-safe:transition-opacity"
            aria-hidden
          >
            {state.left}s
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onTogglePause}
            className="h-9 rounded-lg border border-emerald-300 bg-white px-3 text-sm font-medium text-emerald-900 outline-none hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 dark:border-emerald-800 dark:bg-transparent dark:text-emerald-100 dark:hover:bg-emerald-950/50 dark:focus-visible:ring-offset-zinc-950"
          >
            {state.paused ? "Resume" : "Pause"}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="h-9 rounded-lg bg-emerald-700 px-3 text-sm font-medium text-white outline-none hover:bg-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
          >
            Skip
          </button>
        </div>
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {liveLine}
      </p>
    </Card>
  );
}

export default function WorkoutLogger(props: {
  workoutInstanceId: string;
  /** When false, day name / notes are shown by the parent page. Default true. */
  showDayHeader?: boolean;
}) {
  const showDayHeader = props.showDayHeader !== false;
  const router = useRouter();
  const [workout, setWorkout] = useState<ApiWorkout | null>(null);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("LB");
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [progressionHints, setProgressionHints] = useState<Record<string, string>>({});
  const [restTimer, setRestTimer] = useState<RestTimerState | null>(null);
  const restStripKeyRef = useRef(0);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const deleteTriggerRef = useRef<HTMLButtonElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workouts/${props.workoutInstanceId}`, {
        cache: "no-store",
      });
      const data = (await res.json().catch(() => null)) as
        | { workout?: ApiWorkout; unit?: string; error?: string }
        | null;
      setWorkout(data?.workout ?? null);
      setWeightUnit(data?.unit === "KG" ? "KG" : "LB");
    } finally {
      setLoading(false);
    }
  }, [props.workoutInstanceId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!restTimer || restTimer.paused || restTimer.left <= 0) return;
    const id = setInterval(() => {
      setRestTimer((r) => {
        if (!r || r.paused) return r;
        if (r.left <= 1) return null;
        return { ...r, left: r.left - 1 };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [restTimer !== null, restTimer?.paused, restTimer?.total, restTimer?.exerciseName]);

  const logsByExercise = useMemo(() => {
    const map = new Map<string, ApiWorkout["setLogs"]>();
    for (const l of workout?.setLogs ?? []) {
      const arr = map.get(l.exerciseId) ?? [];
      arr.push(l);
      map.set(l.exerciseId, arr);
    }
    return map;
  }, [workout?.setLogs]);

  const exerciseIdsKey = useMemo(
    () =>
      (workout?.workoutDay.exercises ?? [])
        .map((e) => e.id)
        .sort()
        .join(","),
    [workout?.workoutDay.exercises],
  );

  const workoutRef = useRef(workout);
  workoutRef.current = workout;

  useEffect(() => {
    const w = workoutRef.current;
    if (!w?.id || !exerciseIdsKey) return;
    const ids = w.workoutDay.exercises.map((e) => e.id);
    if (ids.length === 0) return;

    let cancelled = false;
    async function run() {
      const res = await fetch("/api/progression/recommendation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ exerciseIds: ids }),
        cache: "no-store",
      });
      const data = (await res.json().catch(() => null)) as
        | { hints?: Record<string, string> }
        | null;
      if (!cancelled && data?.hints) setProgressionHints(data.hints);
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [workout?.id, exerciseIdsKey]);

  const saveSet = useCallback(
    async (
      input: {
        exerciseId: string;
        setNumber: number;
        reps: number | null;
        weight: number | null;
        rir: number | null;
        completed: boolean;
      },
      exerciseMeta?: {
        restSeconds: number | null;
        setCount: number;
        exerciseName: string;
      },
    ): Promise<boolean> => {
      setSaveError(null);
      try {
        const res = await fetch("/api/logs", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            workoutInstanceId: props.workoutInstanceId,
            ...input,
          }),
        });
        const data = (await res.json().catch(() => null)) as
          | { ok?: boolean; error?: string; setLog?: SetLogRow }
          | null;
        if (!res.ok || !data?.ok) {
          setSaveError(data?.error ?? "Could not save set. Try again.");
          await refresh();
          return false;
        }
        if (data.setLog) {
          setWorkout((prev) => (prev ? mergeSetLogIntoWorkout(prev, data.setLog!) : prev));
          if (
            input.completed &&
            exerciseMeta &&
            exerciseMeta.restSeconds != null &&
            exerciseMeta.restSeconds > 0 &&
            input.setNumber < exerciseMeta.setCount
          ) {
            restStripKeyRef.current += 1;
            setRestTimer({
              total: exerciseMeta.restSeconds,
              left: exerciseMeta.restSeconds,
              paused: false,
              exerciseName: exerciseMeta.exerciseName,
            });
          }
        } else {
          await refresh();
        }
        return true;
      } catch {
        setSaveError(
          "Could not save set. Check your connection and try again. You may be offline or the server is unreachable.",
        );
        await refresh();
        return false;
      }
    },
    [props.workoutInstanceId, refresh],
  );

  async function finishWorkout() {
    setFinishError(null);
    setFinishing(true);
    try {
      const res = await fetch(`/api/workouts/${props.workoutInstanceId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setFinishError(data?.error ?? "Could not finish workout. Try again.");
        await refresh();
        return;
      }
      await refresh();
      router.push("/history");
    } catch {
      setFinishError(
        "Could not finish workout. Check your connection and try again. You may be offline or the server is unreachable.",
      );
      await refresh();
    } finally {
      setFinishing(false);
    }
  }

  function openDeleteDialog() {
    setDeleteError(null);
    deleteDialogRef.current?.showModal();
  }

  function closeDeleteDialog() {
    deleteDialogRef.current?.close();
    queueMicrotask(() => deleteTriggerRef.current?.focus());
  }

  async function confirmDeleteWorkout() {
    setDeleteError(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/workouts/${props.workoutInstanceId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        closeDeleteDialog();
        router.push("/history");
        return;
      }
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setDeleteError(data?.error ?? "Could not delete workout.");
    } finally {
      setDeleting(false);
    }
  }

  const exerciseTotal = workout?.workoutDay.exercises.length ?? 0;

  if (loading && !workout) {
    return <Card className="text-sm text-zinc-700 dark:text-zinc-200">Loading…</Card>;
  }

  if (!workout) {
    return <Card className="text-sm text-zinc-700 dark:text-zinc-200">Workout not found.</Card>;
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {saveError ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {saveError}
        </p>
      ) : null}

      {restTimer ? (
        <RestTimerStrip
          key={restStripKeyRef.current}
          state={restTimer}
          onDismiss={() => setRestTimer(null)}
          onTogglePause={() =>
            setRestTimer((r) => (r ? { ...r, paused: !r.paused } : r))
          }
        />
      ) : null}

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
          {finishError ? (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
              {finishError}
            </p>
          ) : null}
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
          {exerciseTotal > 0 ? (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {exerciseTotal} exercise{exerciseTotal === 1 ? "" : "s"} this session
            </p>
          ) : null}
          {workout.workoutDay.notes ? (
            <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              {workout.workoutDay.notes}
            </p>
          ) : null}
        </Card>
      ) : null}

      {workout.workoutDay.exercises.map((ex, exerciseIndex) => {
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

        const hintText = progressionHints[ex.id];
        const wu = unitShort(weightUnit);

        return (
          <Card key={ex.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Exercise {exerciseIndex + 1} of {exerciseTotal}
                </p>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {ex.name}
                </h3>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                  {ex.setCount} sets · {ex.repRangeMin}–{ex.repRangeMax} reps
                  {ex.restSeconds ? ` · Rest ${ex.restSeconds}s` : ""}
                </p>
              </div>
            </div>

            {hintText ? (
              <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-300">
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                  Progression:
                </span>{" "}
                {hintText}
              </p>
            ) : null}

            {first?.targetWeight != null || first?.targetRepMin != null ? (
              <div className="mt-2 space-y-1 text-xs leading-5 text-zinc-600 dark:text-zinc-300">
                <p>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                    Suggested reps:
                  </span>{" "}
                  {low}–{high}
                  {hasLast ? (
                    <>
                      . Last session: {formatLastSessionRepsPerSet(lastLo, lastHi)}; try to beat that
                      up to {high}.
                    </>
                  ) : null}
                </p>
                {first?.targetWeight != null ? (
                  <div className="space-y-1">
                    <p>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                        Suggested weight:
                      </span>{" "}
                      {first.targetWeight} {wu}
                      {weightNote ? <span className="text-zinc-500"> ({weightNote})</span> : null}
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
                      Choose a load to match the rep range ({wu}).
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
              {logs.map((l, logIndex) => {
                const prevLog = logIndex > 0 ? logs[logIndex - 1] : null;
                const priorWeight =
                  prevLog != null
                    ? (prevLog.weight ?? prevLog.targetWeight ?? null)
                    : null;
                return (
                  <SetRow
                    key={l.id}
                    exerciseName={ex.name}
                    setNumber={l.setNumber}
                    targetWeight={l.targetWeight}
                    reps={l.reps}
                    weight={l.weight}
                    rir={l.rir}
                    completed={l.completed}
                    weightUnit={weightUnit}
                    priorSetWeight={priorWeight}
                    onSave={async (next) => {
                      const ok = await saveSet(
                        {
                          exerciseId: ex.id,
                          setNumber: l.setNumber,
                          ...next,
                        },
                        {
                          restSeconds: ex.restSeconds,
                          setCount: ex.setCount,
                          exerciseName: ex.name,
                        },
                      );
                      return ok;
                    }}
                  />
                );
              })}
            </div>
          </Card>
        );
      })}

      <Card className="border-red-200/80 dark:border-red-900/40">
        <details className="group">
          <summary className="cursor-pointer list-none rounded-lg text-sm font-medium text-zinc-800 outline-none marker:content-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:text-zinc-200 dark:focus-visible:ring-offset-zinc-950 [&::-webkit-details-marker]:hidden">
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
            ref={deleteTriggerRef}
            type="button"
            disabled={finishing || deleting}
            onClick={openDeleteDialog}
            className="mt-3 h-10 w-full rounded-xl border border-red-300 bg-white px-4 text-sm font-medium text-red-700 outline-none hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 disabled:opacity-60 dark:border-red-800 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-950/40 dark:focus-visible:ring-offset-zinc-950 sm:w-auto"
          >
            Delete workout…
          </button>
        </details>
      </Card>

      <dialog
        ref={deleteDialogRef}
        className="max-w-sm rounded-2xl border border-zinc-200 bg-white p-4 text-zinc-950 shadow-xl backdrop:bg-black/50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50"
        onClose={() => setDeleteError(null)}
      >
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Delete this workout?
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          All logged sets for &ldquo;{workout.workoutDay.name}&rdquo; will be removed. This cannot be
          undone.
        </p>
        {deleteError ? (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
            {deleteError}
          </p>
        ) : null}
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={deleting}
            onClick={closeDeleteDialog}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 outline-none hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:border-white/10 dark:bg-transparent dark:text-zinc-50 dark:hover:bg-white/10 dark:focus-visible:ring-offset-zinc-950"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={() => void confirmDeleteWorkout()}
            className="h-10 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white outline-none hover:bg-red-500 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 disabled:opacity-60 dark:focus-visible:ring-offset-zinc-950"
          >
            {deleting ? "Deleting…" : "Delete workout"}
          </button>
        </div>
      </dialog>
    </div>
  );
}

function SetRow(props: {
  exerciseName: string;
  setNumber: number;
  targetWeight: number | null;
  reps: number | null;
  weight: number | null;
  rir: number | null;
  completed: boolean;
  weightUnit: WeightUnit;
  priorSetWeight: number | null;
  onSave: (next: {
    reps: number | null;
    weight: number | null;
    rir: number | null;
    completed: boolean;
  }) => Promise<boolean>;
}) {
  const initialWeight =
    props.weight ?? (props.targetWeight !== null ? props.targetWeight : null);

  const [reps, setReps] = useState(() => repsToInput(props.reps));
  const [weight, setWeight] = useState(
    initialWeight != null && Number.isFinite(initialWeight) ? String(initialWeight) : "",
  );
  const [rir, setRir] = useState(props.rir?.toString() ?? "");
  const [rirOpen, setRirOpen] = useState(
    () => props.rir != null && Number.isFinite(props.rir),
  );
  const [completed, setCompleted] = useState(props.completed);
  const [saving, setSaving] = useState(false);
  const wu = unitShort(props.weightUnit);

  useEffect(() => {
    setReps(repsToInput(props.reps));
    const nextWeight =
      props.weight ?? (props.targetWeight !== null ? props.targetWeight : null);
    setWeight(
      nextWeight != null && Number.isFinite(nextWeight) ? String(nextWeight) : "",
    );
    setRir(props.rir?.toString() ?? "");
    setCompleted(props.completed);
    if (props.rir != null && Number.isFinite(props.rir)) setRirOpen(true);
  }, [
    props.completed,
    props.reps,
    props.rir,
    props.targetWeight,
    props.weight,
  ]);

  const ex = props.exerciseName;
  const n = props.setNumber;
  const repsLabel = `${ex}, set ${n}, reps`;
  const weightLabel = `${ex}, set ${n}, weight in ${wu}`;
  const rirLabel = `${ex}, set ${n}, reps in reserve`;

  function triggerMarkFromKeyboard(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (saving) return;
    const next = !completed;
    setCompleted(next);
    void save(next);
  }

  async function save(nextCompleted: boolean) {
    setSaving(true);
    try {
      const repsTrim = reps.trim();
      const repsNum = repsTrim === "" ? null : Number(repsTrim);

      const weightTrim = weight.trim();
      const weightNum = weightTrim === "" ? null : Number(weightTrim);

      const rirTrim = rir.trim();
      const rirNum = rirTrim === "" ? null : Number(rirTrim);

      const ok = await props.onSave({
        reps: repsNum !== null && Number.isFinite(repsNum) ? repsNum : null,
        weight: weightNum !== null && Number.isFinite(weightNum) ? weightNum : null,
        rir: rirNum !== null && Number.isFinite(rirNum) ? rirNum : null,
        completed: nextCompleted,
      });
      if (!ok) {
        setCompleted(props.completed);
      }
    } finally {
      setSaving(false);
    }
  }

  const markButtonClass = completed
    ? "h-9 w-full shrink-0 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white outline-none hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 disabled:opacity-60 dark:focus-visible:ring-offset-zinc-950 sm:ml-auto sm:w-auto"
    : "h-9 w-full shrink-0 rounded-lg bg-zinc-900 px-3 text-xs font-semibold text-white outline-none hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950 sm:ml-auto sm:w-auto";

  const markAriaLabel = completed
    ? `Undo set ${n} complete for ${ex}`
    : `Mark set ${n} complete for ${ex}`;

  const canCopyWeight =
    props.setNumber > 1 &&
    props.priorSetWeight != null &&
    Number.isFinite(props.priorSetWeight);

  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-zinc-200 p-2 dark:border-white/10 sm:flex-row sm:items-start sm:gap-2">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <div className="w-10 shrink-0 text-center text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Set {props.setNumber}
          </div>
          <input
            aria-label={repsLabel}
            inputMode="numeric"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            onKeyDown={triggerMarkFromKeyboard}
            placeholder="Reps"
            className={`${inputFocusClass} basis-[4.5rem] sm:w-16 sm:flex-none sm:basis-auto`}
          />
          <div className="flex min-w-0 flex-1 basis-[6rem] items-center gap-1 sm:w-24 sm:flex-none sm:basis-auto">
            <input
              aria-label={weightLabel}
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              onKeyDown={triggerMarkFromKeyboard}
              placeholder={wu}
              className={`${inputFocusClass} min-w-0 flex-1 basis-0`}
            />
            <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400" aria-hidden>
              {wu}
            </span>
          </div>
        </div>
        <details
          open={rirOpen}
          onToggle={(e) => setRirOpen(e.currentTarget.open)}
          className="rounded-lg border border-zinc-100 bg-zinc-50/80 px-2 py-1 dark:border-white/5 dark:bg-white/5"
        >
          <summary className="cursor-pointer list-none text-xs font-medium text-zinc-600 outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:text-zinc-300 dark:focus-visible:ring-offset-zinc-950 [&::-webkit-details-marker]:hidden">
            RIR <span className="font-normal text-zinc-500">(optional)</span>
          </summary>
          <div className="mt-2 pb-1">
            <input
              aria-label={rirLabel}
              inputMode="numeric"
              value={rir}
              onChange={(e) => setRir(e.target.value)}
              placeholder="0–10"
              className={`${inputFocusClass} w-full max-w-[6rem]`}
            />
          </div>
        </details>
        {canCopyWeight ? (
          <button
            type="button"
            onClick={() =>
              setWeight(String(props.priorSetWeight as number))
            }
            className="self-start rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700 outline-none hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:border-white/10 dark:bg-transparent dark:text-zinc-200 dark:hover:bg-white/10 dark:focus-visible:ring-offset-zinc-950"
          >
            Same weight as set {props.setNumber - 1} ({props.priorSetWeight} {wu})
          </button>
        ) : null}
      </div>
      <button
        type="button"
        disabled={saving}
        aria-busy={saving}
        aria-label={markAriaLabel}
        onClick={() => {
          const next = !completed;
          setCompleted(next);
          void save(next);
        }}
        className={markButtonClass}
      >
        {saving ? "Saving…" : completed ? "Done" : "Mark"}
      </button>
    </div>
  );
}
