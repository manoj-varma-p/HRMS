import { Role } from "@/constants/roles";
import { EmployeeStatus } from "@/constants/employee-status";
import { EmploymentType } from "@/constants/employment-type";

export interface ReferenceData {
  _id: string;
  name: string;
  isActive: boolean;
}

export interface EmergencyContact {
  name: string;
  phone: string;
}

// The minimal shape GET /employees/assignable returns — deliberately not
// the full Employee record (no email/phone/role/status/etc.), and its
// `department` omits `isActive` since that endpoint's populate() only
// selects `name`.
export interface AssignableEmployee {
  id: string;
  employeeId: string;
  fullName: string;
  department: { _id: string; name: string } | null;
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
  employmentType: EmploymentType;
  permanentSince: string | null;
  salary?: number | null;
  bloodGroup?: string | null;
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
