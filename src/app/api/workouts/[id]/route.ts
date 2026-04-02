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

