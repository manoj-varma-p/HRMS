import { describe, it, expect } from "vitest";
import { countEligibleAccrualMonths } from "./leave.util";

describe("countEligibleAccrualMonths", () => {
  it("returns 0 for an employee who isn't Permanent", () => {
    const result = countEligibleAccrualMonths(null, 2026, "2026-06-01");
    expect(result).toBe(0);
  });

  it("counts nothing for the current, still-incomplete month", () => {
    const result = countEligibleAccrualMonths(new Date("2020-01-01"), 2026, "2026-01-15");
    expect(result).toBe(0);
  });

  it("counts every fully completed month regardless of leave taken", () => {
    // asOf March 5 2026 -> January and February are complete -> 2 months
    const result = countEligibleAccrualMonths(new Date("2020-01-01"), 2026, "2026-03-05");
    expect(result).toBe(2);
  });

  it("truncates the accrual start to the month the employee became Permanent", () => {
    // Became Permanent mid-March 2026; asOf June 1 -> March, April, May complete.
    const result = countEligibleAccrualMonths(new Date("2026-03-15"), 2026, "2026-06-01");
    expect(result).toBe(3);
  });

  it("returns 0 for a year that hasn't started yet", () => {
    const result = countEligibleAccrualMonths(new Date("2020-01-01"), 2027, "2026-07-10");
    expect(result).toBe(0);
  });

  it("returns 0 if permanentSince falls after the requested year ended", () => {
    const result = countEligibleAccrualMonths(new Date("2027-01-01"), 2026, "2026-12-31");
    expect(result).toBe(0);
  });

  it("treats a full past year as entirely complete", () => {
    const result = countEligibleAccrualMonths(new Date("2020-01-01"), 2025, "2026-07-10");
    expect(result).toBe(12);
  });
});
