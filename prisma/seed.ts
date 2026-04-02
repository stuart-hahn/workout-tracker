import { prisma } from "@/lib/db";
import { upperLower4DayTemplate } from "@/lib/program/template";
import { hashPassword } from "@/lib/auth/password";
import { seedDemoWorkoutHistory } from "./seed/demoHistory";

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

  await seedDemoWorkoutHistory(prisma, { userId: user.id, programId: program.id });
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
