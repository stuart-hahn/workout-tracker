import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
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
      for (let setNumber = 1; setNumber <= ex.setCount; setNumber++) {
        await tx.setLog.create({
          data: {
            workoutInstanceId: created.id,
            exerciseId: ex.id,
            setNumber,
            completed: false,
          },
        });
      }
    }

    return created;
  });

  return NextResponse.json({ ok: true, workoutInstanceId: instance.id });
}

