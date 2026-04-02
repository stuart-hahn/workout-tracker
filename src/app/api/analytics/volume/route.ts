import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { aggregateWeeklyVolume } from "@/lib/analytics/volume";

function startOfWeek(date: Date) {
  // Monday start, local time.
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun ... 6 Sat
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const weekStartRaw = searchParams.get("weekStart");
  const base = weekStartRaw ? new Date(weekStartRaw) : new Date();
  if (Number.isNaN(base.getTime())) {
    return NextResponse.json({ error: "Invalid weekStart" }, { status: 400 });
  }

  const weekStart = startOfWeek(base);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const exercises = await prisma.exercise.findMany({
    where: { workoutDay: { program: { userId: user.id, active: true } } },
    select: { id: true, muscleGroupPrimary: true, muscleGroupsSecondary: true },
  });
  const exercisesById = new Map(
    exercises.map((e) => [e.id, { muscleGroupPrimary: e.muscleGroupPrimary, muscleGroupsSecondary: e.muscleGroupsSecondary }]),
  );

  const setLogs = await prisma.setLog.findMany({
    where: {
      workoutInstance: {
        userId: user.id,
        date: { gte: weekStart, lt: weekEnd },
      },
      completed: true,
    },
    select: { exerciseId: true, completed: true, reps: true, weight: true },
  });

  const volume = aggregateWeeklyVolume({ exercisesById, setLogs });

  return NextResponse.json({
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    volume,
  });
}

