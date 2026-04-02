import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { recommendDoubleProgression } from "@/lib/progression/doubleProgression";

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
    select: { id: true, name: true, repRangeMin: true, repRangeMax: true, movementType: true },
  });
  if (!exercise) return NextResponse.json({ error: "Not found" }, { status: 404 });

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

  const rec = recommendDoubleProgression({
    repRangeMin: exercise.repRangeMin,
    repRangeMax: exercise.repRangeMax,
    lastSets,
    weightIncrement: 2.5,
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
    },
    lastWorkoutDate: lastWorkout?.date.toISOString() ?? null,
    recommendation: rec,
    effortHint,
  });
}

