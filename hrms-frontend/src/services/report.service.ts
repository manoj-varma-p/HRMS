import { apiFetch, apiFetchBlob } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";
import {
  AttendanceReportRow,
  DepartmentReportRow,
  EmployeeReportRow,
  LeaveReportRow,
  MonthlySummaryReportRow,
  PaginationInfo,
  ReportPeriod,
} from "@/types/report.types";

type ApiSuccess<T> = { success: true; message: string; data: T };

function toQueryString(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface AttendanceReportParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  department?: string;
  designation?: string;
  employeeId?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function getAttendanceReport(params: AttendanceReportParams) {
  return apiFetch<ApiSuccess<{ rows: AttendanceReportRow[]; pagination: PaginationInfo }>>(
    `${API_ENDPOINTS.REPORTS.ATTENDANCE}${toQueryString({ ...params })}`
  );
}

export async function exportAttendanceReportCsv(
  params: Omit<AttendanceReportParams, "page" | "limit" | "sortBy" | "sortOrder">
): Promise<void> {
  const blob = await apiFetchBlob(
    `${API_ENDPOINTS.REPORTS.ATTENDANCE_EXPORT}${toQueryString({ ...params })}`
  );
  downloadBlob(blob, "attendance-report.csv");
}

export interface LeaveReportParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  department?: string;
  designation?: string;
  employeeId?: string;
  leaveType?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function getLeaveReport(params: LeaveReportParams) {
  return apiFetch<ApiSuccess<{ rows: LeaveReportRow[]; pagination: PaginationInfo }>>(
    `${API_ENDPOINTS.REPORTS.LEAVE}${toQueryString({ ...params })}`
  );
}

export async function exportLeaveReportCsv(
  params: Omit<LeaveReportParams, "page" | "limit" | "sortBy" | "sortOrder">
): Promise<void> {
  const blob = await apiFetchBlob(
    `${API_ENDPOINTS.REPORTS.LEAVE_EXPORT}${toQueryString({ ...params })}`
  );
  downloadBlob(blob, "leave-report.csv");
}

export interface EmployeeReportParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  department?: string;
  designation?: string;
  role?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function getEmployeeReport(params: EmployeeReportParams) {
  return apiFetch<
    ApiSuccess<{ rows: EmployeeReportRow[]; period: ReportPeriod; pagination: PaginationInfo }>
  >(`${API_ENDPOINTS.REPORTS.EMPLOYEES}${toQueryString({ ...params })}`);
}

export async function exportEmployeeReportCsv(
  params: Omit<EmployeeReportParams, "page" | "limit" | "sortBy" | "sortOrder">
): Promise<void> {
  const blob = await apiFetchBlob(
    `${API_ENDPOINTS.REPORTS.EMPLOYEES_EXPORT}${toQueryString({ ...params })}`
  );
  downloadBlob(blob, "employee-report.csv");
}

export interface DepartmentReportParams {
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function getDepartmentReport(params: DepartmentReportParams) {
  return apiFetch<
    ApiSuccess<{
      rows: DepartmentReportRow[];
      period: ReportPeriod & { workingDays: number };
    }>
  >(`${API_ENDPOINTS.REPORTS.DEPARTMENTS}${toQueryString({ ...params })}`);
}

export interface MonthlySummaryReportParams {
  page?: number;
  limit?: number;
  year?: number;
  month?: number;
  department?: string;
  designation?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function getMonthlySummaryReport(params: MonthlySummaryReportParams) {
  return apiFetch<
    ApiSuccess<{
      rows: MonthlySummaryReportRow[];
      year: number;
      month: number;
      pagination: PaginationInfo;
    }>
  >(`${API_ENDPOINTS.REPORTS.MONTHLY_SUMMARY}${toQueryString({ ...params })}`);
}

export function logReportPrint(reportType: string) {
  return apiFetch<ApiSuccess<Record<string, never>>>(API_ENDPOINTS.REPORTS.PRINT_LOG, {
    method: "POST",
    body: JSON.stringify({ reportType }),
  });
}
