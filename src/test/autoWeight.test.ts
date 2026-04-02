import { describe, expect, it } from "vitest";
import { computeAutoTarget, roundTo } from "@/lib/progression/autoWeight";

describe("roundTo", () => {
  it("rounds to nearest step", () => {
    expect(roundTo(52, 5)).toBe(50);
    expect(roundTo(53, 5)).toBe(55);
    expect(roundTo(-27, 5)).toBe(-25);
  });
});

describe("computeAutoTarget", () => {
  it("returns null weight when no history", () => {
    const t = computeAutoTarget({
      unit: "LB",
      repRangeMin: 6,
      repRangeMax: 10,
      assistanceMode: "NONE",
      weightIncrement: 5,
      weightRounding: 5,
      lastSets: [],
    });

    expect(t.targetWeight).toBeNull();
    expect(t.targetReps).toBe(6);
  });

  it("keeps weight and increases reps when below top of range", () => {
    const t = computeAutoTarget({
      unit: "LB",
      repRangeMin: 6,
      repRangeMax: 10,
      assistanceMode: "NONE",
      weightIncrement: 5,
      weightRounding: 5,
      lastSets: [
        { reps: 8, weight: 100, completed: true },
        { reps: 7, weight: 100, completed: true },
      ],
    });

    expect(t.targetWeight).toBe(100);
    expect(t.targetReps).toBe(9);
  });

  it("increases weight when all sets hit top of range", () => {
    const t = computeAutoTarget({
      unit: "LB",
      repRangeMin: 8,
      repRangeMax: 12,
      assistanceMode: "NONE",
      weightIncrement: 5,
      weightRounding: 5,
      lastSets: [
        { reps: 12, weight: 50, completed: true },
        { reps: 12, weight: 50, completed: true },
      ],
    });

    expect(t.targetWeight).toBe(55);
    expect(t.targetReps).toBe(8);
  });

  it("reduces assistance (moves weight toward 0) when assisted hits top", () => {
    const t = computeAutoTarget({
      unit: "LB",
      repRangeMin: 6,
      repRangeMax: 10,
      assistanceMode: "ASSISTED",
      weightIncrement: 5,
      weightRounding: 5,
      lastSets: [
        { reps: 10, weight: -30, completed: true },
        { reps: 10, weight: -30, completed: true },
      ],
    });

    expect(t.targetWeight).toBe(-25);
  });

  it("does not exceed 0 for assisted progression", () => {
    const t = computeAutoTarget({
      unit: "LB",
      repRangeMin: 6,
      repRangeMax: 10,
      assistanceMode: "ASSISTED",
      weightIncrement: 5,
      weightRounding: 5,
      lastSets: [
        { reps: 10, weight: -2, completed: true },
        { reps: 10, weight: -2, completed: true },
      ],
    });

    expect(t.targetWeight).toBe(0);
  });
});

