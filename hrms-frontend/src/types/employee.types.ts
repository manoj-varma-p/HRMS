import { Role } from "@/constants/roles";
import { EmployeeStatus } from "@/constants/employee-status";

export interface ReferenceData {
  _id: string;
  name: string;
  isActive: boolean;
}

export interface EmergencyContact {
  name: string;
  phone: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  department: ReferenceData | null;
  designation: ReferenceData | null;
  role: Role;
  status: EmployeeStatus;
  mustChangePassword: boolean;
  joiningDate: string;
  dateOfBirth: string | null;
  profilePhoto: string | null;
  address: string | null;
  emergencyContact: EmergencyContact | null;
  gracePeriodOverrideMinutes: number | null;
  createdAt: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface EmployeeListResult {
  employees: Employee[];
  pagination: PaginationInfo;
}
