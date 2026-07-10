export const LEAVE_TYPES = {
  SICK: "SICK",
  CASUAL_PAID: "CASUAL_PAID",
  ANNUAL: "ANNUAL",
  UNPAID: "UNPAID",
} as const;

export type LeaveType = (typeof LEAVE_TYPES)[keyof typeof LEAVE_TYPES];

export const LEAVE_REQUEST_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
} as const;

export type LeaveRequestStatus =
  (typeof LEAVE_REQUEST_STATUS)[keyof typeof LEAVE_REQUEST_STATUS];
