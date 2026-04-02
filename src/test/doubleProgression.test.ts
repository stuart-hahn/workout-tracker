import { describe, expect, it } from "vitest";
import { recommendDoubleProgression } from "@/lib/progression/doubleProgression";

describe("recommendDoubleProgression", () => {
  it("recommends adding reps when below top of range", () => {
    const rec = recommendDoubleProgression({
      repRangeMin: 6,
      repRangeMax: 10,
      weightIncrement: 2.5,
      lastSets: [
        { reps: 8, weight: 100, completed: true },
        { reps: 7, weight: 100, completed: true },
      ],
    });

    expect(rec.kind).toBe("add_reps");
    if (rec.kind === "add_reps") {
      expect(rec.suggestedWeight).toBe(100);
      expect(rec.suggestedRepsTarget).toBe(9);
    }
  });

  it("recommends adding weight when all sets hit top of range", () => {
    const rec = recommendDoubleProgression({
      repRangeMin: 8,
      repRangeMax: 12,
      weightIncrement: 5,
      lastSets: [
        { reps: 12, weight: 50, completed: true },
        { reps: 12, weight: 50, completed: true },
      ],
    });

    expect(rec.kind).toBe("add_weight");
    if (rec.kind === "add_weight") {
      expect(rec.suggestedWeight).toBe(55);
      expect(rec.suggestedRepsTarget).toBe(8);
    }
  });
});

