import { Role } from "../../shared/constants/roles";
import { EmployeeStatus } from "../../shared/constants/employeeStatus";

export interface PublicUser {
  id: string;
  employeeId: string;
  email: string;
  role: Role;
  status: EmployeeStatus;
  mustChangePassword: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
