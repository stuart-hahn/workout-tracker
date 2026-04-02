import type { MovementType } from "@/generated/prisma/client";

export type TemplateExercise = {
  name: string;
  movementType: MovementType;
  setCount: number;
  repRangeMin: number;
  repRangeMax: number;
  restSeconds: number;
  notes: string;
  muscleGroupPrimary: string;
  muscleGroupsSecondary: string[];
};

export type TemplateDay = {
  name: string;
  order: number;
  notes: string;
  exercises: TemplateExercise[];
};

export const upperLower4DayTemplate: { programName: string; days: TemplateDay[] } =
  {
    programName: "Upper/Lower 4-day (Template)",
    days: [
      {
        name: "Upper A",
        order: 1,
        notes:
          "Total ~40–45 min. Prioritize upper chest, lats, arms. Controlled tempo, strict form.",
        exercises: [
          {
            name: "Incline DB Press",
            movementType: "COMPOUND",
            setCount: 2,
            repRangeMin: 6,
            repRangeMax: 10,
            restSeconds: 120,
            notes:
              "Upper chest focus. Compounds: ~1 RIR on first set, 0–1 RIR on second.",
            muscleGroupPrimary: "Chest",
            muscleGroupsSecondary: ["FrontDelts", "Triceps"],
          },
          {
            name: "Pull-Ups",
            movementType: "COMPOUND",
            setCount: 2,
            repRangeMin: 6,
            repRangeMax: 10,
            restSeconds: 120,
            notes:
              "Full ROM. Add load when you hit the top of the rep range across sets.",
            muscleGroupPrimary: "Back",
            muscleGroupsSecondary: ["Biceps"],
          },
          {
            name: "Chest-Supported Row",
            movementType: "COMPOUND",
            setCount: 2,
            repRangeMin: 8,
            repRangeMax: 12,
            restSeconds: 120,
            notes:
              "Drive elbows back; avoid body English. Lat + upper back emphasis.",
            muscleGroupPrimary: "Back",
            muscleGroupsSecondary: ["RearDelts", "Biceps"],
          },
          {
            name: "Cable Lateral Raise",
            movementType: "ISOLATION",
            setCount: 2,
            repRangeMin: 12,
            repRangeMax: 20,
            restSeconds: 60,
            notes: "Isolation: 0–1 RIR. Keep traps quiet; smooth tempo.",
            muscleGroupPrimary: "SideDelts",
            muscleGroupsSecondary: [],
          },
          {
            name: "Overhead Triceps Extension",
            movementType: "ISOLATION",
            setCount: 2,
            repRangeMin: 10,
            repRangeMax: 15,
            restSeconds: 60,
            notes: "Long-head emphasis. Full stretch; 0–1 RIR.",
            muscleGroupPrimary: "Triceps",
            muscleGroupsSecondary: [],
          },
          {
            name: "Incline DB Curl",
            movementType: "ISOLATION",
            setCount: 2,
            repRangeMin: 10,
            repRangeMax: 15,
            restSeconds: 60,
            notes: "Full stretch; avoid swinging. 0–1 RIR.",
            muscleGroupPrimary: "Biceps",
            muscleGroupsSecondary: [],
          },
        ],
      },
      {
        name: "Lower A",
        order: 2,
        notes:
          "Total ~35–40 min. Maintain leg balance with posterior chain emphasis. Controlled tempo, strict form.",
        exercises: [
          {
            name: "Squat or Leg Press",
            movementType: "COMPOUND",
            setCount: 2,
            repRangeMin: 6,
            repRangeMax: 10,
            restSeconds: 150,
            notes:
              "Pick one primary quad pattern. Compounds: ~1 RIR first set, 0–1 RIR second.",
            muscleGroupPrimary: "Quads",
            muscleGroupsSecondary: ["Glutes"],
          },
          {
            name: "Romanian Deadlift",
            movementType: "COMPOUND",
            setCount: 2,
            repRangeMin: 6,
            repRangeMax: 10,
            restSeconds: 150,
            notes:
              "Hinge pattern. Feel hamstrings; keep lats tight; stop when form breaks.",
            muscleGroupPrimary: "Hamstrings",
            muscleGroupsSecondary: ["Glutes", "Back"],
          },
          {
            name: "Leg Curl",
            movementType: "ISOLATION",
            setCount: 2,
            repRangeMin: 10,
            repRangeMax: 15,
            restSeconds: 75,
            notes: "Control the eccentric. 0–1 RIR.",
            muscleGroupPrimary: "Hamstrings",
            muscleGroupsSecondary: [],
          },
          {
            name: "Standing Calf Raise",
            movementType: "ISOLATION",
            setCount: 2,
            repRangeMin: 8,
            repRangeMax: 12,
            restSeconds: 60,
            notes: "Pause at stretch + peak contraction. 0–1 RIR.",
            muscleGroupPrimary: "Calves",
            muscleGroupsSecondary: [],
          },
        ],
      },
      {
        name: "Upper B",
        order: 3,
        notes:
          "Total ~40–45 min. Incline press is lighter than Upper A. Prioritize lats, delts, arms.",
        exercises: [
          {
            name: "Incline DB Press (lighter)",
            movementType: "COMPOUND",
            setCount: 2,
            repRangeMin: 8,
            repRangeMax: 12,
            restSeconds: 120,
            notes:
              "Use a load you can control. Compounds: ~1 RIR first set, 0–1 RIR second.",
            muscleGroupPrimary: "Chest",
            muscleGroupsSecondary: ["FrontDelts", "Triceps"],
          },
          {
            name: "Lat Pulldown / Pull-Ups",
            movementType: "COMPOUND",
            setCount: 2,
            repRangeMin: 8,
            repRangeMax: 12,
            restSeconds: 120,
            notes:
              "Choose the best option for recovery. Full ROM; avoid momentum.",
            muscleGroupPrimary: "Back",
            muscleGroupsSecondary: ["Biceps"],
          },
          {
            name: "Chest-Supported Row",
            movementType: "COMPOUND",
            setCount: 2,
            repRangeMin: 8,
            repRangeMax: 12,
            restSeconds: 120,
            notes: "Repeat row pattern; keep form strict.",
            muscleGroupPrimary: "Back",
            muscleGroupsSecondary: ["RearDelts", "Biceps"],
          },
          {
            name: "Cable Lateral Raise",
            movementType: "ISOLATION",
            setCount: 2,
            repRangeMin: 12,
            repRangeMax: 20,
            restSeconds: 60,
            notes: "0–1 RIR. Smooth and controlled.",
            muscleGroupPrimary: "SideDelts",
            muscleGroupsSecondary: [],
          },
          {
            name: "Rear Delt Fly",
            movementType: "ISOLATION",
            setCount: 2,
            repRangeMin: 12,
            repRangeMax: 20,
            restSeconds: 60,
            notes: "0–1 RIR. Keep shoulders down/back; avoid traps.",
            muscleGroupPrimary: "RearDelts",
            muscleGroupsSecondary: ["Back"],
          },
          {
            name: "Triceps Pushdown",
            movementType: "ISOLATION",
            setCount: 2,
            repRangeMin: 10,
            repRangeMax: 15,
            restSeconds: 60,
            notes: "0–1 RIR. Lock in elbows; full extension.",
            muscleGroupPrimary: "Triceps",
            muscleGroupsSecondary: [],
          },
          {
            name: "Incline DB Curl",
            movementType: "ISOLATION",
            setCount: 2,
            repRangeMin: 10,
            repRangeMax: 15,
            restSeconds: 60,
            notes: "0–1 RIR. Full stretch; strict form.",
            muscleGroupPrimary: "Biceps",
            muscleGroupsSecondary: [],
          },
        ],
      },
      {
        name: "Lower B",
        order: 4,
        notes:
          "Maintain recovery. Optional single-leg variation if desired. Posterior chain emphasis.",
        exercises: [
          {
            name: "Leg Press or Squat",
            movementType: "COMPOUND",
            setCount: 2,
            repRangeMin: 8,
            repRangeMax: 12,
            restSeconds: 150,
            notes:
              "Choose based on recovery and joints. Compounds: ~1 RIR first, 0–1 RIR second.",
            muscleGroupPrimary: "Quads",
            muscleGroupsSecondary: ["Glutes"],
          },
          {
            name: "Romanian Deadlift",
            movementType: "COMPOUND",
            setCount: 2,
            repRangeMin: 6,
            repRangeMax: 10,
            restSeconds: 150,
            notes: "Same hinge rules as Lower A; strict tempo.",
            muscleGroupPrimary: "Hamstrings",
            muscleGroupsSecondary: ["Glutes", "Back"],
          },
          {
            name: "Leg Curl",
            movementType: "ISOLATION",
            setCount: 2,
            repRangeMin: 10,
            repRangeMax: 15,
            restSeconds: 75,
            notes: "0–1 RIR. Control the eccentric.",
            muscleGroupPrimary: "Hamstrings",
            muscleGroupsSecondary: [],
          },
          {
            name: "Standing Calf Raise",
            movementType: "ISOLATION",
            setCount: 2,
            repRangeMin: 8,
            repRangeMax: 12,
            restSeconds: 60,
            notes: "0–1 RIR. Pause at the top and bottom.",
            muscleGroupPrimary: "Calves",
            muscleGroupsSecondary: [],
          },
        ],
      },
    ],
  };

