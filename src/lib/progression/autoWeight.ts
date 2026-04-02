import type { AssistanceMode, UnitSystem } from "@/generated/prisma/client";

export type AutoTarget = {
  targetWeight: number | null;
  targetRepMin: number;
  targetRepMax: number;
  lastSessionRepMin: number | null;
  lastSessionRepMax: number | null;
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
      rationale:
        input.assistanceMode === "ASSISTED"
          ? "Hit the top of the rep range last time: reduce assistance (move weight toward 0) and work across the full rep range again."
          : "Hit the top of the rep range last time: increase weight and restart from the low end of the range.",
    };
  }

  // Double progression (add-reps): beat last session's minimum completed reps, up to program max.
  const nextLow = minReps + 1;
  const targetRepMin = Math.max(repRangeMin, Math.min(repRangeMax, nextLow));
  const targetRepMax = repRangeMax;

  return {
    targetWeight: Number(roundTo(workingWeight, input.weightRounding).toFixed(2)),
    targetRepMin,
    targetRepMax,
    lastSessionRepMin: sessionBounds!.min,
    lastSessionRepMax: sessionBounds!.max,
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
