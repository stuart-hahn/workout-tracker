import type { AssistanceMode, UnitSystem } from "@/generated/prisma/client";

export type AutoTarget = {
  targetWeight: number | null;
  targetReps: number;
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

export function computeAutoTarget(input: AutoWeightInput): AutoTarget {
  const completed = input.lastSets.filter((s) => s.completed);
  const completedWithReps = completed.filter(
    (s) => typeof s.reps === "number" && Number.isFinite(s.reps),
  );
  const completedWeights = completed
    .map((s) => s.weight)
    .filter((w): w is number => typeof w === "number" && Number.isFinite(w));

  const repRangeMin = Math.max(1, input.repRangeMin);
  const repRangeMax = Math.max(repRangeMin, input.repRangeMax);

  const workingWeight = pickWorkingWeight(completedWeights);
  if (!workingWeight || completedWithReps.length === 0) {
    return {
      targetWeight: null,
      targetReps: repRangeMin,
      rationale: "No usable history yet; start at the low end of the rep range.",
    };
  }

  const reps = completedWithReps.map((s) => s.reps as number);
  const minReps = Math.min(...reps);
  const maxReps = Math.max(...reps);
  const hitTopAcrossSets = minReps >= repRangeMax && reps.length === completed.length;

  if (hitTopAcrossSets) {
    const progressed = workingWeight + input.weightIncrement;
    const capped =
      input.assistanceMode === "ASSISTED" ? Math.min(0, progressed) : progressed;
    const nextWeight = Number(roundTo(capped, input.weightRounding).toFixed(2));

    return {
      targetWeight: nextWeight,
      targetReps: repRangeMin,
      rationale:
        input.assistanceMode === "ASSISTED"
          ? "Hit the top of the rep range: reduce assistance (move weight toward 0)."
          : "Hit the top of the rep range: increase weight and restart near the low end of the range.",
    };
  }

  const nextReps = Math.min(repRangeMax, maxReps + 1);
  return {
    targetWeight: Number(roundTo(workingWeight, input.weightRounding).toFixed(2)),
    targetReps: nextReps,
    rationale:
      "Stay at the same weight and add reps until you reach the top of the range, then increase weight.",
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

