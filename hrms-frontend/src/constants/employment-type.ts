export const EMPLOYMENT_TYPE = {
  PROBATION: "PROBATION",
  PERMANENT: "PERMANENT",
} as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPE)[keyof typeof EMPLOYMENT_TYPE];
