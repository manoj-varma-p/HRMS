export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  EMPLOYEE: "EMPLOYEE",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
