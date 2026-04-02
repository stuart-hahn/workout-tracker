import type { AssistanceMode, UnitSystem } from "@/generated/prisma/client";

export type AutoTarget = {
  targetWeight: number | null;
  targetRepMin: number;
  targetRepMax: number;
  lastSessionRepMin: number | null;
  lastSessionRepMax: number | null;
  /** Median completed weight from last session; null when no usable history. */
  lastSessionWorkingWeight: number | null;
  /** User-facing copy with unit baked in (lb/kg). */
  weightExplanation: string;
  rationale: string;
};

export type AutoWeightInput = {
  unit: UnitSystem;
  repRangeMin: number;
  repRangeMax: number;
  assistanceMode: AssistanceMode;
  weightIncrement: number;
  weightRounding: number;
  lastSets: Array<{ reps: number | null; weight: number | null; completed: boolean }>;
};

export function roundTo(value: number, step: number) {
  if (!Number.isFinite(value)) return value;
  if (!Number.isFinite(step) || step <= 0) return value;
  return Math.round(value / step) * step;
}

function formatLoad(w: number, unit: UnitSystem): string {
  const label = unit === "KG" ? "kg" : "lb";
  const abs = Math.abs(w);
  const body = Number.isInteger(abs) ? String(abs) : abs.toFixed(2).replace(/\.?0+$/, "");
  return w < 0 ? `−${body} ${label}` : `${body} ${label}`;
}

function formatIncrement(inc: number, unit: UnitSystem): string {
  const label = unit === "KG" ? "kg" : "lb";
  const abs = Math.abs(inc);
  const body = Number.isInteger(abs) ? String(abs) : abs.toFixed(2).replace(/\.?0+$/, "");
  return `${body} ${label}`;
}

/** Builds the “Suggested weight” explanation (last time, this time, why). Exported for tests. */
export function buildWeightExplanation(params: {
  unit: UnitSystem;
  assistanceMode: AssistanceMode;
  lastSessionWorkingWeight: number | null;
  targetWeight: number | null;
  hitTopAcrossSets: boolean;
  weightIncrement: number;
}): string {
  const { unit, assistanceMode, lastSessionWorkingWeight, targetWeight, hitTopAcrossSets, weightIncrement } =
    params;

  if (targetWeight === null || lastSessionWorkingWeight === null) {
    return "No logged working weight from a completed session yet. Choose a load that fits the suggested rep range—we’ll remember it for next time.";
  }

  const lastFmt = formatLoad(lastSessionWorkingWeight, unit);
  const targetFmt = formatLoad(targetWeight, unit);

  if (!hitTopAcrossSets) {
    return `Last session your working weight was about ${lastFmt} (median across completed sets). Hold ${targetFmt} this session and push reps toward the top of the range before adding load.`;
  }

  if (assistanceMode === "ASSISTED") {
    const step = formatIncrement(weightIncrement, unit);
    if (targetWeight === 0) {
      return `Last session you used ${lastFmt} logged as assistance (help subtracted from bodyweight) and hit the rep ceiling. Try ${targetFmt}—no assistance—this session and work through the rep range again.`;
    }
    return `Last session assistance was ${lastFmt} (negative = help removed from bodyweight). You hit the top of the rep range; reduce assistance to ${targetFmt} this time—${step} less help, closer to bodyweight.`;
  }

  const step = formatIncrement(weightIncrement, unit);
  return `Last session you used ${lastFmt} and reached the top of the rep range on your completed sets. Increase to ${targetFmt} this time—about ${step} more—and build reps back up from the bottom of the range.`;
}

function pickWorkingWeight(weights: number[]) {
  if (weights.length === 0) return null;
  const sorted = [...weights].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function lastSessionRepBounds(repsValues: number[]): { min: number; max: number } | null {
  if (repsValues.length === 0) return null;
  return { min: Math.min(...repsValues), max: Math.max(...repsValues) };
}

function completedWithFiniteReps(
  sets: Array<{ reps: number | null; weight: number | null; completed: boolean }>,
): Array<{ reps: number; weight: number | null; completed: boolean }> {
  return sets.filter(
    (s): s is { reps: number; weight: number | null; completed: boolean } =>
      typeof s.reps === "number" && Number.isFinite(s.reps),
  );
}

export function computeAutoTarget(input: AutoWeightInput): AutoTarget {
  const completed = input.lastSets.filter((s) => s.completed);
  const completedWithReps = completedWithFiniteReps(completed);
  const completedWeights = completed
    .map((s) => s.weight)
    .filter((w): w is number => typeof w === "number" && Number.isFinite(w));

  const repRangeMin = Math.max(1, input.repRangeMin);
  const repRangeMax = Math.max(repRangeMin, input.repRangeMax);

  const sessionReps = completedWithReps.map((s) => s.reps);
  const sessionBounds = lastSessionRepBounds(sessionReps);

  const workingWeight = pickWorkingWeight(completedWeights);
  if (!workingWeight || completedWithReps.length === 0) {
    return {
      targetWeight: null,
      targetRepMin: repRangeMin,
      targetRepMax: repRangeMax,
      lastSessionRepMin: null,
      lastSessionRepMax: null,
      lastSessionWorkingWeight: null,
      weightExplanation: buildWeightExplanation({
        unit: input.unit,
        assistanceMode: input.assistanceMode,
        lastSessionWorkingWeight: null,
        targetWeight: null,
        hitTopAcrossSets: false,
        weightIncrement: input.weightIncrement,
      }),
      rationale:
        "No usable history yet; suggested reps span your program range. Pick a weight and aim somewhere in that rep band.",
    };
  }

  const minReps = Math.min(...sessionReps);
  const hitTopAcrossSets =
    minReps >= repRangeMax && completedWithReps.length === completed.length;

  if (hitTopAcrossSets) {
    const progressed = workingWeight + input.weightIncrement;
    const capped =
      input.assistanceMode === "ASSISTED" ? Math.min(0, progressed) : progressed;
    const nextWeight = Number(roundTo(capped, input.weightRounding).toFixed(2));

    return {
      targetWeight: nextWeight,
      targetRepMin: repRangeMin,
      targetRepMax: repRangeMax,
      lastSessionRepMin: sessionBounds!.min,
      lastSessionRepMax: sessionBounds!.max,
      lastSessionWorkingWeight: workingWeight,
      weightExplanation: buildWeightExplanation({
        unit: input.unit,
        assistanceMode: input.assistanceMode,
        lastSessionWorkingWeight: workingWeight,
        targetWeight: nextWeight,
        hitTopAcrossSets: true,
        weightIncrement: input.weightIncrement,
      }),
      rationale:
        input.assistanceMode === "ASSISTED"
          ? "Hit the top of the rep range last time: reduce assistance (move weight toward 0) and work across the full rep range again."
          : "Hit the top of the rep range last time: increase weight and restart from the low end of the range.",
    };
  }

  const nextLow = minReps + 1;
  const targetRepMin = Math.max(repRangeMin, Math.min(repRangeMax, nextLow));
  const targetRepMax = repRangeMax;

  const holdWeight = Number(roundTo(workingWeight, input.weightRounding).toFixed(2));

  return {
    targetWeight: holdWeight,
    targetRepMin,
    targetRepMax,
    lastSessionRepMin: sessionBounds!.min,
    lastSessionRepMax: sessionBounds!.max,
    lastSessionWorkingWeight: workingWeight,
    weightExplanation: buildWeightExplanation({
      unit: input.unit,
      assistanceMode: input.assistanceMode,
      lastSessionWorkingWeight: workingWeight,
      targetWeight: holdWeight,
      hitTopAcrossSets: false,
      weightIncrement: input.weightIncrement,
    }),
    rationale:
      "Stay at the same weight and beat last session’s reps, working up to the top of the range before adding weight.",
  };
}

export function defaultIncrement(unit: UnitSystem, movementType: "COMPOUND" | "ISOLATION") {
  if (unit === "KG") return movementType === "COMPOUND" ? 2.5 : 1.25;
  return movementType === "COMPOUND" ? 5 : 2.5;
}

export function defaultRounding(unit: UnitSystem, movementType: "COMPOUND" | "ISOLATION") {
  if (unit === "KG") return movementType === "COMPOUND" ? 2.5 : 1.25;
  return movementType === "COMPOUND" ? 5 : 2.5;
}
