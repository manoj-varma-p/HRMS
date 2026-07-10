import { AttendanceStatus } from "@/constants/attendance-status";
import { LeaveRequestStatus, LeaveType } from "@/constants/leave-types";
import { EmployeeStatus } from "@/constants/employee-status";
import { Role } from "@/constants/roles";
import { MonthSummary } from "@/types/attendance.types";

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AttendanceReportRow {
  id: string;
  employeeId: string;
  fullName: string;
  department: string | null;
  designation: string | null;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workedHours: number | null;
  status: AttendanceStatus;
}

export interface LeaveReportRow {
  id: string;
  employeeId: string;
  fullName: string;
  department: string | null;
  designation: string | null;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveRequestStatus;
  reviewedBy: string | null;
  createdAt: string;
}

export interface EmployeeReportRow {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  department: string | null;
  designation: string | null;
  role: Role;
  status: EmployeeStatus;
  joiningDate: string;
  presentDays: number;
  leaveDays: number;
}

export interface DepartmentReportRow {
  id: string;
  name: string;
  totalEmployees: number;
  activeEmployees: number;
  noticePeriod: number;
  resigned: number;
  terminated: number;
  attendancePercentage: number;
  totalLeaveDays: number;
}

export interface MonthlySummaryReportRow {
  id: string;
  employeeId: string;
  fullName: string;
  department: string | null;
  designation: string | null;
  summary: MonthSummary;
}

export interface ReportPeriod {
  start: string;
  end: string;
}

export interface SearchResultItem {
  id: string;
  name: string;
}

export interface EmployeeSearchResultItem {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
}

export interface GlobalSearchResult {
  employees: EmployeeSearchResultItem[];
  departments: SearchResultItem[];
  designations: SearchResultItem[];
}
