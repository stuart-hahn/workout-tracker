import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const workout = await prisma.workoutInstance.findFirst({
    where: { id, userId: user.id },
    include: {
      workoutDay: {
        include: {
          exercises: {
            orderBy: { id: "asc" },
          },
        },
      },
      setLogs: { orderBy: { setNumber: "asc" } },
    },
  });

  if (!workout) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ workout });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { status?: unknown } | null;
  const status = body?.status;

  if (status !== "COMPLETED") {
    return NextResponse.json({ error: "Invalid or missing status" }, { status: 400 });
  }

  const existing = await prisma.workoutInstance.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.workoutInstance.update({
    where: { id },
    data: { status: "COMPLETED" },
  });

  return NextResponse.json({ ok: true });
}
