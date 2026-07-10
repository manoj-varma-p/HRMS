import { enumerateISTDateStrings, getISTDateString, getMonthBounds } from "../../shared/utils/istDate";
import { isConfiguredWeekend } from "../configuration/configuration.cache";
import { HolidayModel } from "../holiday/holiday.model";
import { LEAVE_REQUEST_STATUS } from "../../shared/constants/leaveTypes";
import { LeaveRequestModel } from "./leave-request.model";

/**
 * Working-day count within [startDate, endDate], inclusive — excludes
 * Sundays and active company holidays, since spending leave balance on a
 * day off you already have doesn't make sense. Mirrors the same weekend/
 * holiday rules the attendance engine uses (Phase 4), so the two never
 * disagree about which days are "working days."
 */
export async function computeLeaveWorkingDays(
  startDate: string,
  endDate: string
): Promise<number> {
  const dateStrings = enumerateISTDateStrings(startDate, endDate);

  const holidays = await HolidayModel.find({
    isActive: true,
    date: { $gte: startDate, $lte: endDate },
  }).select("date");
  const holidayDates = new Set(holidays.map((h) => h.date));

  let count = 0;
  for (const dateStr of dateStrings) {
    const isWeekend = isConfiguredWeekend(new Date(`${dateStr}T12:00:00+05:30`));
    if (!isWeekend && !holidayDates.has(dateStr)) {
      count += 1;
    }
  }
  return count;
}

function monthKeyAdd(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  let year = y;
  let month = m + delta;
  while (month > 12) {
    month -= 12;
    year += 1;
  }
  while (month < 1) {
    month += 12;
    year -= 1;
  }
  return `${year}-${String(month).padStart(2, "0")}`;
}

/**
 * Annual Leave's quota isn't a fixed number set upfront — it's earned leave,
 * accruing once per fully-completed calendar month in which the employee
 * took no leave of any kind (Sick, Casual, Annual, or Unpaid). Computed
 * fresh from LeaveRequestModel every time rather than tracked as a running
 * counter, so it stays correct even if a past request is later edited or
 * backfilled — same "recompute from source data" approach the dashboard's
 * trend charts already use. The current calendar month never counts yet:
 * accrual only credits once a month has fully passed.
 */
export async function getAnnualLeaveAccrued(
  employeeId: string,
  joiningDate: Date,
  year: number,
  asOfDateStr: string,
  accrualPerMonth: number
): Promise<number> {
  const yearStartMonthKey = `${year}-01`;
  const yearEndMonthKey = `${year}-12`;
  const joiningMonthKey = getISTDateString(joiningDate).slice(0, 7);
  const startMonthKey = joiningMonthKey > yearStartMonthKey ? joiningMonthKey : yearStartMonthKey;

  const currentMonthKey = asOfDateStr.slice(0, 7);
  const lastCompleteMonthKey =
    currentMonthKey > yearEndMonthKey ? yearEndMonthKey : monthKeyAdd(currentMonthKey, -1);

  if (startMonthKey > lastCompleteMonthKey || lastCompleteMonthKey < yearStartMonthKey) {
    return 0;
  }

  const monthKeys: string[] = [];
  for (let cursor = startMonthKey; cursor <= lastCompleteMonthKey; cursor = monthKeyAdd(cursor, 1)) {
    monthKeys.push(cursor);
  }
  if (monthKeys.length === 0) return 0;

  const scanStart = getMonthBounds(monthKeys[0]).start;
  const scanEnd = getMonthBounds(monthKeys[monthKeys.length - 1]).end;

  const requests = await LeaveRequestModel.find({
    employee: employeeId,
    status: LEAVE_REQUEST_STATUS.APPROVED,
    startDate: { $lte: scanEnd },
    endDate: { $gte: scanStart },
  }).select("startDate endDate");

  let accrued = 0;
  for (const monthKey of monthKeys) {
    const { start, end } = getMonthBounds(monthKey);
    const hasLeaveThisMonth = requests.some((r) => r.startDate <= end && r.endDate >= start);
    if (!hasLeaveThisMonth) accrued += accrualPerMonth;
  }
  return Math.round(accrued * 100) / 100;
}
