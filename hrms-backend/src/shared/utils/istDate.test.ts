import { describe, it, expect } from "vitest";
import { getMonthBounds, daysBetweenDateStrings } from "./istDate";

describe("getMonthBounds", () => {
  it("returns the first and last day of a 31-day month", () => {
    expect(getMonthBounds("2026-01")).toEqual({ start: "2026-01-01", end: "2026-01-31" });
  });

  it("returns the first and last day of a 30-day month", () => {
    expect(getMonthBounds("2026-04")).toEqual({ start: "2026-04-01", end: "2026-04-30" });
  });

  it("handles February in a non-leap year", () => {
    expect(getMonthBounds("2026-02")).toEqual({ start: "2026-02-01", end: "2026-02-28" });
  });

  it("handles February in a leap year", () => {
    expect(getMonthBounds("2024-02")).toEqual({ start: "2024-02-01", end: "2024-02-29" });
  });

  it("handles December (year-boundary month)", () => {
    expect(getMonthBounds("2026-12")).toEqual({ start: "2026-12-01", end: "2026-12-31" });
  });
});

describe("daysBetweenDateStrings", () => {
  it("returns 0 for the same date", () => {
    expect(daysBetweenDateStrings("2026-07-10", "2026-07-10")).toBe(0);
  });

  it("returns a positive count when b is after a", () => {
    expect(daysBetweenDateStrings("2026-07-10", "2026-07-14")).toBe(4);
  });

  it("returns a negative count when b is before a", () => {
    expect(daysBetweenDateStrings("2026-07-14", "2026-07-10")).toBe(-4);
  });

  it("counts correctly across a month boundary", () => {
    expect(daysBetweenDateStrings("2026-07-28", "2026-08-02")).toBe(5);
  });

  it("counts correctly across a year boundary", () => {
    expect(daysBetweenDateStrings("2026-12-29", "2027-01-03")).toBe(5);
  });
});
