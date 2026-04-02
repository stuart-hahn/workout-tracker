import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const program = await prisma.program.findFirst({
    where: { userId: user.id, active: true },
    include: {
      workoutDays: {
        orderBy: { order: "asc" },
        include: { exercises: { orderBy: { name: "asc" } } },
      },
    },
  });

  return NextResponse.json({ program });
}

