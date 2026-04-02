import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  computeAutoTarget,
  defaultIncrement,
  defaultRounding,
} from "@/lib/progression/autoWeight";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const exerciseId = searchParams.get("exerciseId") ?? "";
  if (!exerciseId) {
    return NextResponse.json({ error: "Missing exerciseId" }, { status: 400 });
  }

  const exercise = await prisma.exercise.findFirst({
    where: { id: exerciseId, workoutDay: { program: { userId: user.id, active: true } } },
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
  if (!exercise) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { unit: true },
  });
  const unit = dbUser?.unit ?? "LB";

  const lastWorkout = await prisma.workoutInstance.findFirst({
    where: {
      userId: user.id,
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

  return NextResponse.json({
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
  });
}

