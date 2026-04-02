import { prisma } from "@/lib/db";
import {
  computeAutoTarget,
  defaultIncrement,
  defaultRounding,
} from "@/lib/progression/autoWeight";

export type ExerciseRecommendationPayload = {
  exercise: {
    id: string;
    name: string;
    repRangeMin: number;
    repRangeMax: number;
    movementType: string;
    assistanceMode: string;
  };
  lastWorkoutDate: string | null;
  unit: string;
  targets: {
    weightIncrement: number;
    weightRounding: number;
    targetWeight: number | null;
    targetRepMin: number | null;
    targetRepMax: number | null;
    lastSessionRepMin: number | null;
    lastSessionRepMax: number | null;
    lastSessionWorkingWeight: number | null;
    weightExplanation: string | null;
    rationale: string;
  };
  effortHint: string;
};

/** Full recommendation payload for one exercise (same as GET /api/progression/recommendation). */
export async function buildExerciseRecommendation(
  userId: string,
  exerciseId: string,
): Promise<ExerciseRecommendationPayload | null> {
  const exercise = await prisma.exercise.findFirst({
    where: { id: exerciseId, workoutDay: { program: { userId, active: true } } },
    select: {
      id: true,
      name: true,
      repRangeMin: true,
      repRangeMax: true,
      movementType: true,
      weightIncrement: true,
      weightRounding: true,
      assistanceMode: true,
    },
  });
  if (!exercise) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { unit: true },
  });
  const unit = dbUser?.unit ?? "LB";

  const lastWorkout = await prisma.workoutInstance.findFirst({
    where: {
      userId,
      status: "COMPLETED",
      setLogs: { some: { exerciseId } },
    },
    orderBy: { date: "desc" },
    select: { id: true, date: true },
  });

  const lastSets = lastWorkout
    ? await prisma.setLog.findMany({
        where: { workoutInstanceId: lastWorkout.id, exerciseId },
        orderBy: { setNumber: "asc" },
        select: { reps: true, weight: true, completed: true },
      })
    : [];

  const weightIncrement =
    exercise.weightIncrement ??
    defaultIncrement(unit, exercise.movementType === "COMPOUND" ? "COMPOUND" : "ISOLATION");
  const weightRounding =
    exercise.weightRounding ??
    defaultRounding(unit, exercise.movementType === "COMPOUND" ? "COMPOUND" : "ISOLATION");

  const target = computeAutoTarget({
    unit,
    repRangeMin: exercise.repRangeMin,
    repRangeMax: exercise.repRangeMax,
    lastSets,
    assistanceMode: exercise.assistanceMode,
    weightIncrement,
    weightRounding,
  });

  const effortHint =
    exercise.movementType === "COMPOUND"
      ? "Compounds: ~1 RIR first set, 0–1 RIR second."
      : "Isolation: 0–1 RIR.";

  return {
    exercise: {
      id: exercise.id,
      name: exercise.name,
      repRangeMin: exercise.repRangeMin,
      repRangeMax: exercise.repRangeMax,
      movementType: exercise.movementType,
      assistanceMode: exercise.assistanceMode,
    },
    lastWorkoutDate: lastWorkout?.date.toISOString() ?? null,
    unit,
    targets: {
      weightIncrement,
      weightRounding,
      targetWeight: target.targetWeight,
      targetRepMin: target.targetRepMin,
      targetRepMax: target.targetRepMax,
      lastSessionRepMin: target.lastSessionRepMin,
      lastSessionRepMax: target.lastSessionRepMax,
      lastSessionWorkingWeight: target.lastSessionWorkingWeight,
      weightExplanation: target.weightExplanation,
      rationale: target.rationale,
    },
    effortHint,
  };
}

/** Display string used on the workout screen (matches previous client-side join). */
export function progressionDisplayText(payload: ExerciseRecommendationPayload): string {
  return [payload.targets.rationale, payload.effortHint].filter(Boolean).join(" ");
}
