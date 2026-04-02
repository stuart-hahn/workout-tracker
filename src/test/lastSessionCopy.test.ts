import { describe, expect, it } from "vitest";
import { formatLastSessionRepsPerSet } from "@/lib/workouts/lastSessionCopy";

describe("formatLastSessionRepsPerSet", () => {
  it("uses singular wording when min equals max", () => {
    expect(formatLastSessionRepsPerSet(8, 8)).toBe("8 reps per set");
  });

  it("uses a range when min differs from max", () => {
    expect(formatLastSessionRepsPerSet(7, 8)).toBe("7–8 reps per set");
  });
});
