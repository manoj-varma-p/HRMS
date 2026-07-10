import { AttendanceStatus } from "@/constants/attendance-status";

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  ON_TIME: "On Time",
  LATE: "Late",
  HALF_DAY: "Half Day",
  ABSENT: "Absent",
  ON_LEAVE: "On Leave",
  HOLIDAY: "Holiday",
  WEEKEND: "Weekend",
  MISSED_CHECKOUT: "Missed Checkout",
};

// Calendar/legend colors per the spec: Green/Yellow/Orange/Red/Blue/Purple/Gray
// for the seven named statuses. Missed Checkout isn't in that list, so it
// gets a distinct color (rose) that doesn't collide with any of the seven.
export const ATTENDANCE_STATUS_DOT: Record<AttendanceStatus, string> = {
  ON_TIME: "bg-emerald-500",
  LATE: "bg-yellow-500",
  HALF_DAY: "bg-orange-500",
  ABSENT: "bg-red-500",
  ON_LEAVE: "bg-blue-500",
  HOLIDAY: "bg-purple-500",
  WEEKEND: "bg-gray-400",
  MISSED_CHECKOUT: "bg-rose-600",
};

export const ATTENDANCE_STATUS_BADGE: Record<AttendanceStatus, string> = {
  ON_TIME: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent",
  LATE: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-transparent",
  HALF_DAY: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-transparent",
  ABSENT: "bg-red-500/10 text-red-600 dark:text-red-400 border-transparent",
  ON_LEAVE: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-transparent",
  HOLIDAY: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-transparent",
  WEEKEND: "bg-muted text-muted-foreground border-transparent",
  MISSED_CHECKOUT: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-transparent",
};
