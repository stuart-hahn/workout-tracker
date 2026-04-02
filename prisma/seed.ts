import { prisma } from "@/lib/db";
import { upperLower4DayTemplate } from "@/lib/program/template";
import { hashPassword } from "@/lib/auth/password";

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

async function main() {
  const demoEmail = "demo@example.com";
  const demoPassword = "password123";

  const existing = await prisma.user.findUnique({ where: { email: demoEmail } });
  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: { unit: "LB" },
      })
    : await prisma.user.create({
        data: {
          email: demoEmail,
          passwordHash: await hashPassword(demoPassword),
          unit: "LB",
        },
      });

  await prisma.program.deleteMany({ where: { userId: user.id } });

  const program = await prisma.program.create({
    data: { userId: user.id, name: upperLower4DayTemplate.programName, active: true },
  });

  for (const day of upperLower4DayTemplate.days) {
    const workoutDay = await prisma.workoutDay.create({
      data: {
        programId: program.id,
        name: day.name,
        order: day.order,
        notes: day.notes,
      },
    });

    for (const ex of day.exercises) {
      await prisma.exercise.create({
        data: {
          workoutDayId: workoutDay.id,
          name: ex.name,
          movementType: ex.movementType,
          notes: ex.notes,
          restSeconds: ex.restSeconds,
          repRangeMin: ex.repRangeMin,
          repRangeMax: ex.repRangeMax,
          setCount: ex.setCount,
          weightIncrement: ex.movementType === "COMPOUND" ? 5 : 2.5,
          weightRounding: ex.movementType === "COMPOUND" ? 5 : 2.5,
          isBodyweight: ex.name.toLowerCase().includes("pull-up"),
          assistanceMode: ex.name.toLowerCase().includes("pull-up")
            ? "ASSISTED"
            : "NONE",
          muscleGroupPrimary: ex.muscleGroupPrimary,
          muscleGroupsSecondary: JSON.stringify(ex.muscleGroupsSecondary),
        },
      });
    }
  }

  // Sample workout history (2 sessions) for analytics + progression demos.
  const upperA = await prisma.workoutDay.findFirstOrThrow({
    where: { programId: program.id, name: "Upper A" },
    include: { exercises: true },
  });
  const lowerA = await prisma.workoutDay.findFirstOrThrow({
    where: { programId: program.id, name: "Lower A" },
    include: { exercises: true },
  });

  const upperInstance = await prisma.workoutInstance.create({
    data: {
      userId: user.id,
      programId: program.id,
      workoutDayId: upperA.id,
      date: daysAgo(5),
      status: "COMPLETED",
    },
  });
  const lowerInstance = await prisma.workoutInstance.create({
    data: {
      userId: user.id,
      programId: program.id,
      workoutDayId: lowerA.id,
      date: daysAgo(3),
      status: "COMPLETED",
    },
  });

  async function seedExercise(
    instanceId: string,
    exerciseName: string,
    sets: Array<{ reps: number; weight: number; rir: number }>,
  ) {
    const exercise = await prisma.exercise.findFirstOrThrow({
      where: { workoutDay: { programId: program.id }, name: exerciseName },
    });
    for (let i = 0; i < sets.length; i++) {
      const s = sets[i];
      await prisma.setLog.upsert({
        where: {
          workoutInstanceId_exerciseId_setNumber: {
            workoutInstanceId: instanceId,
            exerciseId: exercise.id,
            setNumber: i + 1,
          },
        },
        create: {
          workoutInstanceId: instanceId,
          exerciseId: exercise.id,
          setNumber: i + 1,
          reps: s.reps,
          weight: s.weight,
          rir: s.rir,
          completed: true,
        },
        update: {
          reps: s.reps,
          weight: s.weight,
          rir: s.rir,
          completed: true,
        },
      });
    }
  }

  await seedExercise(upperInstance.id, "Incline DB Press", [
    { reps: 8, weight: 55, rir: 1 },
    { reps: 8, weight: 55, rir: 0 },
  ]);
  await seedExercise(upperInstance.id, "Pull-Ups", [
    { reps: 8, weight: -30, rir: 1 },
    { reps: 7, weight: -30, rir: 0 },
  ]);
  await seedExercise(lowerInstance.id, "Squat or Leg Press", [
    { reps: 8, weight: 185, rir: 1 },
    { reps: 8, weight: 185, rir: 0 },
  ]);
  await seedExercise(lowerInstance.id, "Romanian Deadlift", [
    { reps: 8, weight: 165, rir: 1 },
    { reps: 7, weight: 165, rir: 0 },
  ]);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

