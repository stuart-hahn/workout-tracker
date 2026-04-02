export type DoubleProgressionRecommendation =
  | { kind: "no_history"; message: string }
  | {
      kind: "add_reps";
      message: string;
      suggestedWeight: number | null;
      suggestedRepsTarget: number;
    }
  | {
      kind: "add_weight";
      message: string;
      suggestedWeight: number;
      suggestedRepsTarget: number;
    };

export function recommendDoubleProgression(input: {
  repRangeMin: number;
  repRangeMax: number;
  lastSets: Array<{ reps: number | null; weight: number | null; completed: boolean }>;
  weightIncrement: number;
}): DoubleProgressionRecommendation {
  const completedSets = input.lastSets.filter((s) => s.completed);
  if (completedSets.length === 0) {
    return { kind: "no_history", message: "Log a completed session to get a recommendation." };
  }

  const reps = completedSets
    .map((s) => s.reps)
    .filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  const weights = completedSets
    .map((s) => s.weight)
    .filter((n): n is number => typeof n === "number" && Number.isFinite(n));

  const maxReps = reps.length ? Math.max(...reps) : null;
  const minReps = reps.length ? Math.min(...reps) : null;
  const lastWeight = weights.length ? weights[0] : null;

  if (maxReps === null) {
    return { kind: "no_history", message: "Add reps for completed sets to get a recommendation." };
  }

  const hitTopAcrossSets =
    minReps !== null && minReps >= input.repRangeMax && reps.length === completedSets.length;

  if (hitTopAcrossSets && lastWeight !== null) {
    const nextWeight = Number((lastWeight + input.weightIncrement).toFixed(2));
    return {
      kind: "add_weight",
      message: `Hit the top of the range. Next time, add weight and aim for ${input.repRangeMin}+ reps.`,
      suggestedWeight: nextWeight,
      suggestedRepsTarget: input.repRangeMin,
    };
  }

  const nextRepTarget = Math.min(input.repRangeMax, maxReps + 1);
  return {
    kind: "add_reps",
    message: `Add reps at the same weight until you reach ${input.repRangeMax} reps, then increase weight.`,
    suggestedWeight: lastWeight,
    suggestedRepsTarget: nextRepTarget,
  };
}

