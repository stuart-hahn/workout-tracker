import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { endOfUtcDayExclusive, startOfUtcDay } from "@/lib/dates/utcDay";
import {
  computeAutoTarget,
  defaultIncrement,
  defaultRounding,
} from "@/lib/progression/autoWeight";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range");

  if (range === "recent") {
    const limitRaw = searchParams.get("limit");
    const limit = Math.min(100, Math.max(1, Number(limitRaw) || 50));
    const workouts = await prisma.workoutInstance.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take: limit,
      include: { workoutDay: true },
    });
    return NextResponse.json({ workouts });
  }

  const weekStart = searchParams.get("weekStart");

  const start = weekStart ? new Date(weekStart) : new Date();
  if (Number.isNaN(start.getTime())) {
    return NextResponse.json({ error: "Invalid weekStart" }, { status: 400 });
  }
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const workouts = await prisma.workoutInstance.findMany({
    where: { userId: user.id, date: { gte: start, lt: end } },
    orderBy: { date: "desc" },
    include: { workoutDay: true },
  });

  return NextResponse.json({ workouts });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | { workoutDayId?: unknown; date?: unknown }
    | null;

  const workoutDayId = typeof body?.workoutDayId === "string" ? body.workoutDayId : "";
  const dateStr = typeof body?.date === "string" ? body.date : "";
  const date = dateStr ? new Date(dateStr) : new Date();

  if (!workoutDayId) {
    return NextResponse.json({ error: "Missing workoutDayId" }, { status: 400 });
  }
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const day = await prisma.workoutDay.findFirst({
    where: { id: workoutDayId, program: { userId: user.id, active: true } },
    include: { program: true, exercises: true },
  });
  if (!day) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const dayStart = startOfUtcDay(date);
  const dayEnd = endOfUtcDayExclusive(date);

  const existing = await prisma.workoutInstance.findFirst({
    where: {
      userId: user.id,
      workoutDayId: day.id,
      programId: day.programId,
      status: "IN_PROGRESS",
      date: { gte: dayStart, lt: dayEnd },
    },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json({
      ok: true,
      workoutInstanceId: existing.id,
      resumed: true,
    });
  }

  const userWithUnit = await prisma.user.findUnique({
    where: { id: user.id },
    select: { unit: true },
  });
  const unit = userWithUnit?.unit ?? "LB";

  const instance = await prisma.$transaction(async (tx) => {
    const created = await tx.workoutInstance.create({
      data: {
        userId: user.id,
        programId: day.programId,
        workoutDayId: day.id,
        date,
        status: "IN_PROGRESS",
      },
    });

    for (const ex of day.exercises) {
      const lastWorkout = await tx.workoutInstance.findFirst({
        where: {
          userId: user.id,
          status: "COMPLETED",
          setLogs: { some: { exerciseId: ex.id } },
        },
        orderBy: { date: "desc" },
        select: { id: true },
      });

      const lastSets = lastWorkout
        ? await tx.setLog.findMany({
            where: { workoutInstanceId: lastWorkout.id, exerciseId: ex.id },
            orderBy: { setNumber: "asc" },
            select: { reps: true, weight: true, completed: true },
          })
        : [];

      const weightIncrement =
        ex.weightIncrement ??
        defaultIncrement(unit, ex.movementType === "COMPOUND" ? "COMPOUND" : "ISOLATION");
      const weightRounding =
        ex.weightRounding ??
        defaultRounding(unit, ex.movementType === "COMPOUND" ? "COMPOUND" : "ISOLATION");

      const target = computeAutoTarget({
        unit,
        repRangeMin: ex.repRangeMin,
        repRangeMax: ex.repRangeMax,
        assistanceMode: ex.assistanceMode,
        weightIncrement,
        weightRounding,
        lastSets,
      });

      for (let setNumber = 1; setNumber <= ex.setCount; setNumber++) {
        await tx.setLog.create({
          data: {
            workoutInstanceId: created.id,
            exerciseId: ex.id,
            setNumber,
            targetRepMin: target.targetRepMin,
            targetRepMax: target.targetRepMax,
            lastSessionRepMin: target.lastSessionRepMin,
            lastSessionRepMax: target.lastSessionRepMax,
            lastSessionWorkingWeight: target.lastSessionWorkingWeight,
            weightExplanation: target.weightExplanation,
            targetWeight: target.targetWeight,
            completed: false,
          },
        });
      }
    }

    return created;
  });

  return NextResponse.json({ ok: true, workoutInstanceId: instance.id, resumed: false });
}
