import { HALF_DAY_THRESHOLD_HOURS } from "../../shared/constants/officeHours";
import { ATTENDANCE_STATUS, AttendanceStatus } from "../../shared/constants/attendanceStatus";
import { diffInHours, getISTMinutesOfDay } from "../../shared/utils/istDate";
import { getOfficeHoursMinutes } from "../configuration/configuration.cache";
import { StoredAttendanceStatus } from "./attendance.model";

/**
 * Always derives from the raw check-in/check-out timestamps — never from a
 * previously stored status — so re-computation after a correction is
 * approved is a pure function of the (possibly updated) times, not a patch
 * on top of stale state. Office start time and grace period come from the
 * live Configuration cache (Phase 9) rather than a fixed constant, so
 * changing office hours in Company Administration takes effect immediately.
 *
 * `graceMinutesOverride` lets one employee have a different grace period
 * than the company default (e.g. a longer commute) — pass
 * `user.gracePeriodOverrideMinutes`; null/undefined falls back to the
 * company-wide value, same as leaving it unset.
 */
export function computeAttendanceStatus(
  checkIn: Date,
  checkOut: Date | null,
  graceMinutesOverride?: number | null
): { status: StoredAttendanceStatus; workedHours: number | null } {
  const { startMinutes, graceMinutes } = getOfficeHoursMinutes();
  const onTimeCutoffMinutes = startMinutes + (graceMinutesOverride ?? graceMinutes);
  const provisional: StoredAttendanceStatus =
    getISTMinutesOfDay(checkIn) <= onTimeCutoffMinutes
      ? ATTENDANCE_STATUS.ON_TIME
      : ATTENDANCE_STATUS.LATE;

  if (!checkOut) {
    return { status: provisional, workedHours: null };
  }

  const workedHours = diffInHours(checkIn, checkOut);
  const status =
    workedHours < HALF_DAY_THRESHOLD_HOURS ? ATTENDANCE_STATUS.HALF_DAY : provisional;

  return { status, workedHours };
}

/**
 * The read-time status adjustment (checked in, never checked out, and the
 * day is over -> Missed Checkout) — extracted here so the Reports module
 * (Phase 7) can reuse the exact same rule instead of re-deriving it.
 */
export function deriveDisplayStatus(
  record: { checkIn: Date | null; checkOut: Date | null; date: string; status: StoredAttendanceStatus },
  todayStr: string
): AttendanceStatus {
  if (record.checkIn && !record.checkOut && record.date < todayStr) {
    return ATTENDANCE_STATUS.MISSED_CHECKOUT;
  }
  return record.status;
}
