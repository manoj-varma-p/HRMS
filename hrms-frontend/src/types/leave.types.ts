import { LeaveType, LeaveRequestStatus } from "@/constants/leave-types";

export interface LeaveBalanceBucket {
  used: number;
  total: number | null;
  baseTotal?: number | null;
  remaining: number | null;
  extra?: number;
}

export interface AnnualLeaveBalanceBucket {
  used: number;
  accrued: number;
  baseAccrued?: number;
  remaining: number;
  extra?: number;
}

export interface LeaveBalance {
  year: number;
  sick: {
    half1: LeaveBalanceBucket;
    half2: LeaveBalanceBucket;
  };
  casualPaid: {
    half1: LeaveBalanceBucket;
    half2: LeaveBalanceBucket;
  };
  annual: AnnualLeaveBalanceBucket;
  unpaid: LeaveBalanceBucket;
}

export interface LeaveEmployeeRef {
  _id: string;
  employeeId: string;
  fullName: string;
  department?: { _id: string; name: string } | null;
  designation?: { _id: string; name: string } | null;
}

export interface LeaveRequest {
  id: string;
  employee: string | LeaveEmployeeRef;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveRequestStatus;
  reviewedBy: string | null;
  reviewComment: string | null;
  createdAt: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type HolidayType = "NATIONAL" | "COMPANY" | "OPTIONAL";

export interface Holiday {
  _id: string;
  date: string;
  name: string;
  description: string | null;
  type: HolidayType;
  isActive: boolean;
}
