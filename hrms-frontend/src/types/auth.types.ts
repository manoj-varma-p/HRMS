import { Role } from "@/constants/roles";
import { EmployeeStatus } from "@/constants/employee-status";

export interface AuthUser {
  id: string;
  employeeId: string;
  email: string;
  role: Role;
  status: EmployeeStatus;
  mustChangePassword: boolean;
  // Departments this user heads — [] for everyone else. Not a role.
  departmentHeadOf: { id: string; name: string }[];
}

export interface AuthSession {
  accessToken: string;
  user: AuthUser;
}
