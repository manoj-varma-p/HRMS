import { RecentActivityEntry } from "@/types/dashboard.types";

const ACTION_LABELS: Record<string, string> = {
  EMPLOYEE_CREATED: "created employee",
  EMPLOYEE_UPDATED: "updated employee",
  EMPLOYEE_ACTIVATED: "activated employee",
  EMPLOYEE_DEACTIVATED: "deactivated employee",
  DEPARTMENT_CREATED: "created department",
  DEPARTMENT_UPDATED: "updated department",
  DESIGNATION_CREATED: "created designation",
  DESIGNATION_UPDATED: "updated designation",
  CHECK_IN: "checked in",
  CHECK_OUT: "checked out",
  ATTENDANCE_CORRECTION_REQUESTED: "requested an attendance correction",
  ATTENDANCE_CORRECTION_APPROVED: "approved an attendance correction",
  ATTENDANCE_CORRECTION_REJECTED: "rejected an attendance correction",
  LEAVE_APPLIED: "applied for leave",
  LEAVE_APPROVED: "approved a leave request",
  LEAVE_REJECTED: "rejected a leave request",
  LEAVE_CANCELLED: "cancelled a leave request",
  HOLIDAY_CREATED: "added a holiday",
  HOLIDAY_UPDATED: "updated a holiday",
  HOLIDAY_ACTIVATED: "activated a holiday",
  HOLIDAY_DEACTIVATED: "deactivated a holiday",
  REPORT_EXPORTED: "exported a report",
  REPORT_PRINTED: "printed a report",
  ANNOUNCEMENT_CREATED: "created an announcement",
  ANNOUNCEMENT_UPDATED: "updated an announcement",
  ANNOUNCEMENT_PUBLISHED: "published an announcement",
  ANNOUNCEMENT_ARCHIVED: "archived an announcement",
};

export function formatActivityLabel(entry: RecentActivityEntry): string {
  const verb = ACTION_LABELS[entry.action] ?? entry.action.toLowerCase().replace(/_/g, " ");
  const name = (entry.metadata?.name ?? entry.metadata?.title) as string | undefined;
  const suffix = name ? ` "${name}"` : "";
  return `${entry.actorEmployeeId} ${verb}${suffix}`;
}
