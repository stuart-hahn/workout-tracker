import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  buildExerciseRecommendation,
  progressionDisplayText,
  type ExerciseRecommendationPayload,
} from "@/lib/progression/exerciseRecommendation";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const exerciseId = searchParams.get("exerciseId") ?? "";
  if (!exerciseId) {
    return NextResponse.json({ error: "Missing exerciseId" }, { status: 400 });
  }

  const payload = await buildExerciseRecommendation(user.id, exerciseId);
  if (!payload) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(payload);
}

type BatchBody = { exerciseIds?: unknown };

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as BatchBody | null;
  const raw = body?.exerciseIds;
  if (!Array.isArray(raw) || raw.length === 0) {
    return NextResponse.json({ error: "Missing exerciseIds array" }, { status: 400 });
  }

  const exerciseIds = [
    ...new Set(raw.filter((id): id is string => typeof id === "string" && id.length > 0)),
  ];
  if (exerciseIds.length === 0) {
    return NextResponse.json({ error: "No valid exercise ids" }, { status: 400 });
  }
  if (exerciseIds.length > 80) {
    return NextResponse.json({ error: "Too many exercise ids" }, { status: 400 });
  }

  const entries = await Promise.all(
    exerciseIds.map(async (id) => {
      const payload = await buildExerciseRecommendation(user.id, id);
      return [id, payload] as const;
    }),
  );

  const hints: Record<string, string> = {};
  const full: Record<string, ExerciseRecommendationPayload> = {};
  for (const [id, payload] of entries) {
    if (payload) {
      hints[id] = progressionDisplayText(payload);
      full[id] = payload;
    }
  }

  return NextResponse.json({ hints, full });
}
