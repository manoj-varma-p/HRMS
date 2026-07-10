import { describe, it, expect, vi, beforeEach } from "vitest";

// getAnnualLeaveAccrued's only DB dependency is a read query against
// LeaveRequestModel — mocked here so this stays a fast, DB-free unit test
// of the month-bucketing/accrual math itself.
const find = vi.fn();
vi.mock("./leave-request.model", () => ({
  LeaveRequestModel: { find: (...args: unknown[]) => find(...args) },
}));

import { getAnnualLeaveAccrued } from "./leave.util";

function mockApprovedRequests(requests: { startDate: string; endDate: string }[]) {
  find.mockReturnValue({ select: vi.fn().mockResolvedValue(requests) });
}

describe("getAnnualLeaveAccrued", () => {
  beforeEach(() => {
    find.mockReset();
  });

  it("accrues nothing for the current, still-incomplete month", async () => {
    mockApprovedRequests([]);
    const result = await getAnnualLeaveAccrued(
      "emp1",
      new Date("2020-01-01"),
      2026,
      "2026-01-15",
      1.25
    );
    expect(result).toBe(0);
  });

  it("accrues once per fully completed month with no leave taken", async () => {
    mockApprovedRequests([]);
    // asOf March 5 2026 -> January and February are complete -> 2 * 1.25
    const result = await getAnnualLeaveAccrued(
      "emp1",
      new Date("2020-01-01"),
      2026,
      "2026-03-05",
      1.25
    );
    expect(result).toBe(2.5);
  });

  it("skips a month in which any leave (of any type) overlapped", async () => {
    mockApprovedRequests([{ startDate: "2026-02-10", endDate: "2026-02-12" }]);
    const result = await getAnnualLeaveAccrued(
      "emp1",
      new Date("2020-01-01"),
      2026,
      "2026-03-05",
      1.25
    );
    // January accrues, February doesn't.
    expect(result).toBe(1.25);
  });

  it("blocks accrual for every month a multi-month request spans", async () => {
    mockApprovedRequests([{ startDate: "2026-01-30", endDate: "2026-02-02" }]);
    const result = await getAnnualLeaveAccrued(
      "emp1",
      new Date("2020-01-01"),
      2026,
      "2026-03-05",
      1.25
    );
    // The request touches both January and February.
    expect(result).toBe(0);
  });

  it("truncates the accrual start to the employee's joining month", async () => {
    mockApprovedRequests([]);
    // Joined mid-March 2026; asOf June 1 -> March, April, May complete.
    const result = await getAnnualLeaveAccrued(
      "emp1",
      new Date("2026-03-15"),
      2026,
      "2026-06-01",
      1.25
    );
    expect(result).toBe(3.75);
  });

  it("returns 0 for a year that hasn't started yet", async () => {
    mockApprovedRequests([]);
    const result = await getAnnualLeaveAccrued(
      "emp1",
      new Date("2020-01-01"),
      2027,
      "2026-07-10",
      1.25
    );
    expect(result).toBe(0);
  });

  it("returns 0 if the employee joined after the requested year ended", async () => {
    mockApprovedRequests([]);
    const result = await getAnnualLeaveAccrued(
      "emp1",
      new Date("2027-01-01"),
      2026,
      "2026-12-31",
      1.25
    );
    expect(result).toBe(0);
  });

  it("treats a full past year as entirely complete", async () => {
    mockApprovedRequests([]);
    const result = await getAnnualLeaveAccrued(
      "emp1",
      new Date("2020-01-01"),
      2025,
      "2026-07-10",
      1.25
    );
    expect(result).toBe(15); // 12 months * 1.25
  });
});
