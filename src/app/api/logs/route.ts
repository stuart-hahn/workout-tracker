import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | {
        workoutInstanceId?: unknown;
        exerciseId?: unknown;
        setNumber?: unknown;
        reps?: unknown;
        weight?: unknown;
        rir?: unknown;
        completed?: unknown;
      }
    | null;

  const workoutInstanceId =
    typeof body?.workoutInstanceId === "string" ? body.workoutInstanceId : "";
  const exerciseId = typeof body?.exerciseId === "string" ? body.exerciseId : "";
  const setNumber = typeof body?.setNumber === "number" ? body.setNumber : NaN;

  if (!workoutInstanceId || !exerciseId || !Number.isFinite(setNumber)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const workout = await prisma.workoutInstance.findFirst({
    where: { id: workoutInstanceId, userId: user.id },
  });
  if (!workout) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const reps = typeof body?.reps === "number" ? body.reps : null;
  const weight = typeof body?.weight === "number" ? body.weight : null;
  const rir = typeof body?.rir === "number" ? body.rir : null;
  const completed = typeof body?.completed === "boolean" ? body.completed : false;

  const setLog = await prisma.setLog.upsert({
    where: {
      workoutInstanceId_exerciseId_setNumber: {
        workoutInstanceId,
        exerciseId,
        setNumber,
      },
    },
    create: {
      workoutInstanceId,
      exerciseId,
      setNumber,
      reps,
      weight,
      rir,
      completed,
    },
    update: {
      reps,
      weight,
      rir,
      completed,
    },
  });

  return NextResponse.json({ ok: true, setLog });
}

