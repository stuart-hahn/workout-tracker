import type { PrismaClient } from "@/generated/prisma/client";

const WEEK_COUNT = 5;

/** Mon=1 … Fri=5 in JS getUTCDay(); we schedule Mon/Tue/Thu/Fri. */
const SESSION_SCHEDULE: { dayOffsetFromMonday: number; workoutDayName: string }[] = [
  { dayOffsetFromMonday: 0, workoutDayName: "Upper A" },
  { dayOffsetFromMonday: 1, workoutDayName: "Lower A" },
  { dayOffsetFromMonday: 3, workoutDayName: "Upper B" },
  { dayOffsetFromMonday: 4, workoutDayName: "Lower B" },
];

const START_WEIGHTS: Record<string, { w: number; r1: number; r2: number }> = {
  "Incline DB Press": { w: 45, r1: 6, r2: 6 },
  "Pull-Ups": { w: -45, r1: 6, r2: 5 },
  "Chest-Supported Row": { w: 100, r1: 8, r2: 8 },
  "Cable Lateral Raise": { w: 12.5, r1: 12, r2: 12 },
  "Overhead Triceps Extension": { w: 25, r1: 10, r2: 10 },
  "Incline DB Curl": { w: 22.5, r1: 10, r2: 10 },
  "Squat or Leg Press": { w: 135, r1: 6, r2: 6 },
  "Romanian Deadlift": { w: 120, r1: 6, r2: 6 },
  "Leg Curl": { w: 45, r1: 10, r2: 10 },
  "Standing Calf Raise": { w: 90, r1: 8, r2: 8 },
  "Incline DB Press (lighter)": { w: 35, r1: 8, r2: 8 },
  "Lat Pulldown / Pull-Ups": { w: -38, r1: 8, r2: 8 },
  "Rear Delt Fly": { w: 15, r1: 12, r2: 12 },
  "Triceps Pushdown": { w: 32.5, r1: 10, r2: 10 },
  "Leg Press or Squat": { w: 200, r1: 8, r2: 8 },
};

function utcNoon(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m, d, 12, 0, 0, 0));
}

/** Most recent Friday (UTC) on or before `ref`. */
function utcMostRecentFriday(ref: Date): Date {
  const d = utcNoon(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate());
  const dow = d.getUTCDay();
  const delta = (dow - 5 + 7) % 7;
  d.setUTCDate(d.getUTCDate() - delta);
  return d;
}

/** Monday of week 0: five full Mon–Fri cycles ending on the most recent Friday. */
function anchorMondayUtc(): Date {
  const fri = utcMostRecentFriday(new Date());
  const mon = new Date(fri.getTime());
  mon.setUTCDate(mon.getUTCDate() - 32);
  return mon;
}

function addUtcDays(base: Date, days: number): Date {
  const d = new Date(base.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function evolveAtWeek(
  startW: number,
  startR1: number,
  startR2: number,
  repMin: number,
  repMax: number,
  wInc: number,
  assisted: boolean,
  weekIndex: number,
): { w: number; r1: number; r2: number } {
  let w = startW;
  let r1 = startR1;
  let r2 = startR2;
  for (let i = 0; i < weekIndex; i++) {
    if (r1 >= repMax && r2 >= repMax) {
      w = assisted ? Math.min(0, w + wInc) : w + wInc;
      r1 = repMin;
      r2 = repMin;
    } else if (r1 <= r2) {
      if (r1 < repMax) r1++;
      else if (r2 < repMax) r2++;
    } else {
      if (r2 < repMax) r2++;
      else if (r1 < repMax) r1++;
    }
  }
  return { w, r1, r2 };
}

function buildSetsForExercise(
  ex: {
    name: string;
    movementType: string;
    repRangeMin: number;
    repRangeMax: number;
    weightIncrement: number | null;
    assistanceMode: string;
    setCount: number;
  },
  weekIndex: number,
): Array<{ reps: number; weight: number; rir: number }> {
  const start =
    START_WEIGHTS[ex.name] ?? {
      w: ex.movementType === "COMPOUND" ? 50 : 17.5,
      r1: ex.repRangeMin,
      r2: ex.repRangeMin,
    };
  const wInc =
    ex.weightIncrement ?? (ex.movementType === "COMPOUND" ? 5 : 2.5);
  const assisted = ex.assistanceMode === "ASSISTED";
  const { w, r1, r2 } = evolveAtWeek(
    start.w,
    start.r1,
    start.r2,
    ex.repRangeMin,
    ex.repRangeMax,
    wInc,
    assisted,
    weekIndex,
  );

  const count = Math.max(1, ex.setCount);
  const reps = [r1, r2];
  while (reps.length < count) {
    reps.push(reps[reps.length - 1] ?? ex.repRangeMin);
  }
  const rirs = [1, 0];
  while (rirs.length < count) {
    rirs.push(0);
  }

  return reps.slice(0, count).map((repsVal, i) => ({
    reps: repsVal,
    weight: Number(w.toFixed(2)),
    rir: rirs[i] ?? 0,
  }));
}

export async function seedDemoWorkoutHistory(
  prisma: PrismaClient,
  params: { userId: string; programId: string },
) {
  const workoutDays = await prisma.workoutDay.findMany({
    where: { programId: params.programId },
    include: { exercises: { orderBy: { id: "asc" } } },
    orderBy: { order: "asc" },
  });
  const byName = new Map(workoutDays.map((d) => [d.name, d]));
  const anchorMonday = anchorMondayUtc();

  for (let week = 0; week < WEEK_COUNT; week++) {
    for (const slot of SESSION_SCHEDULE) {
      const day = byName.get(slot.workoutDayName);
      if (!day) {
        throw new Error(`seed: missing workout day ${slot.workoutDayName}`);
      }
      const sessionDate = addUtcDays(
        anchorMonday,
        week * 7 + slot.dayOffsetFromMonday,
      );

      const instance = await prisma.workoutInstance.create({
        data: {
          userId: params.userId,
          programId: params.programId,
          workoutDayId: day.id,
          date: sessionDate,
          status: "COMPLETED",
        },
      });

      for (const ex of day.exercises) {
        const sets = buildSetsForExercise(ex, week);
        for (let i = 0; i < sets.length; i++) {
          const s = sets[i];
          await prisma.setLog.create({
            data: {
              workoutInstanceId: instance.id,
              exerciseId: ex.id,
              setNumber: i + 1,
              reps: s.reps,
              weight: s.weight,
              rir: s.rir,
              completed: true,
            },
          });
        }
      }
    }
  }
}
