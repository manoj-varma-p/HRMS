import { Role } from "../../shared/constants/roles";
import { EmployeeStatus } from "../../shared/constants/employeeStatus";

export interface PublicUser {
  id: string;
  employeeId: string;
  email: string;
  role: Role;
  status: EmployeeStatus;
  mustChangePassword: boolean;
  // Departments this user heads (see Department.headEmployeeId) — [] for
  // everyone else. Not a role; an EMPLOYEE or ADMIN can head a department.
  departmentHeadOf: { id: string; name: string }[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
