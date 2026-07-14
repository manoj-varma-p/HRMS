// Every employee starts on Probation; an admin promotes them to Permanent
// whenever they decide (a simple one-way flag — there's no automated
// probation-period tracking and no "revert to Probation" action). Only
// Permanent employees accrue Annual Leave (see leave.service.ts).
export const EMPLOYMENT_TYPE = {
  PROBATION: "PROBATION",
  PERMANENT: "PERMANENT",
} as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPE)[keyof typeof EMPLOYMENT_TYPE];
