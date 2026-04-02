import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { endOfUtcDayExclusive, startOfUtcDay } from "@/lib/dates/utcDay";

/** Today’s most recently updated in-progress session, for header “Log” resume link. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ workoutInstanceId: null });
  }

  const now = new Date();
  const dayStart = startOfUtcDay(now);
  const dayEnd = endOfUtcDayExclusive(now);

  const row = await prisma.workoutInstance.findFirst({
    where: {
      userId: user.id,
      status: "IN_PROGRESS",
      date: { gte: dayStart, lt: dayEnd },
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });

  return NextResponse.json({ workoutInstanceId: row?.id ?? null });
}
