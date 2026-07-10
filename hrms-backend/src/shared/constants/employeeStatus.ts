export const EMPLOYEE_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  NOTICE_PERIOD: "NOTICE_PERIOD",
  RESIGNED: "RESIGNED",
  TERMINATED: "TERMINATED",
} as const;

export type EmployeeStatus =
  (typeof EMPLOYEE_STATUS)[keyof typeof EMPLOYEE_STATUS];

// Single source of truth for "can this account currently use the app" —
// consumed by auth.service.ts (login/refresh), the authenticate middleware
// (live per-request check), and employee.service.ts (clearing a stale
// refresh token when a status change moves someone out of this set).
export const LOGIN_ALLOWED_STATUSES: EmployeeStatus[] = [
  EMPLOYEE_STATUS.ACTIVE,
  EMPLOYEE_STATUS.NOTICE_PERIOD,
];
