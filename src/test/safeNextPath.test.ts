import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/auth/safe-next-path";

describe("safeNextPath", () => {
  it("returns undefined for null and empty", () => {
    expect(safeNextPath(null)).toBeUndefined();
    expect(safeNextPath("")).toBeUndefined();
  });

  it("allows internal paths", () => {
    expect(safeNextPath("/today")).toBe("/today");
    expect(safeNextPath("/analytics/volume")).toBe("/analytics/volume");
    expect(safeNextPath("/workouts/abc-123")).toBe("/workouts/abc-123");
  });

  it("allows query on same path", () => {
    expect(safeNextPath("/today?foo=1")).toBe("/today?foo=1");
  });

  it("rejects open redirects and login loop targets", () => {
    expect(safeNextPath("//evil.com")).toBeUndefined();
    expect(safeNextPath("/login")).toBeUndefined();
    expect(safeNextPath("/register")).toBeUndefined();
    expect(safeNextPath("https://evil.com/phish")).toBeUndefined();
  });

  it("rejects path traversal", () => {
    expect(safeNextPath("/../admin")).toBeUndefined();
  });

  it("decodes encoded paths", () => {
    expect(safeNextPath(encodeURIComponent("/today"))).toBe("/today");
  });
});
