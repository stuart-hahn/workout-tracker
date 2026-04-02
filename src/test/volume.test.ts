import { describe, expect, it } from "vitest";
import { aggregateWeeklyVolume } from "@/lib/analytics/volume";

describe("aggregateWeeklyVolume", () => {
  it("counts primary sets and weighted secondary sets", () => {
    const exercisesById = new Map([
      [
        "ex1",
        {
          muscleGroupPrimary: "Chest",
          muscleGroupsSecondary: JSON.stringify(["Triceps"]),
        },
      ],
    ]);

    const rows = aggregateWeeklyVolume({
      exercisesById,
      setLogs: [
        { exerciseId: "ex1", completed: true, reps: 10, weight: 50 },
        { exerciseId: "ex1", completed: true, reps: 8, weight: 50 },
        { exerciseId: "ex1", completed: false, reps: 12, weight: 50 },
      ],
      options: { primaryWeight: 1.0, secondaryWeight: 0.5 },
    });

    const chest = rows.find((r) => r.muscleGroup === "Chest");
    const triceps = rows.find((r) => r.muscleGroup === "Triceps");

    expect(chest?.hardSets).toBe(2);
    expect(triceps?.hardSets).toBe(1); // 2 sets * 0.5

    // tonnage = (10*50 + 8*50) = 900
    expect(chest?.tonnage).toBe(900);
    expect(triceps?.tonnage).toBe(450);
  });
});

