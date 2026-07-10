import { LeaveRequestStatus } from "@/constants/leave-types";

export const LEAVE_STATUS_LABELS: Record<LeaveRequestStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export const LEAVE_STATUS_BADGE: Record<LeaveRequestStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-transparent",
  APPROVED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent",
  REJECTED: "bg-red-500/10 text-red-600 dark:text-red-400 border-transparent",
  CANCELLED: "bg-muted text-muted-foreground border-transparent",
};

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  SICK: "Sick Leave",
  CASUAL_PAID: "Casual/Paid Leave",
  ANNUAL: "Annual Leave",
  UNPAID: "Unpaid Leave",
};
