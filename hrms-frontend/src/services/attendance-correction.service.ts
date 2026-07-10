import { apiFetch } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { AttendanceCorrection, PaginationInfo } from "@/types/attendance.types";

type ApiSuccess<T> = { success: true; message: string; data: T };

function toQueryString(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export interface RequestCorrectionInput {
  date: string;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  reason: string;
}

export function requestCorrection(input: RequestCorrectionInput) {
  return apiFetch<ApiSuccess<{ correction: AttendanceCorrection }>>(
    API_ENDPOINTS.ATTENDANCE_CORRECTIONS.CREATE,
    { method: "POST", body: JSON.stringify(input) }
  );
}

export function myCorrections(params: { page?: number; limit?: number; status?: string }) {
  return apiFetch<
    ApiSuccess<{ corrections: AttendanceCorrection[]; pagination: PaginationInfo }>
  >(`${API_ENDPOINTS.ATTENDANCE_CORRECTIONS.MINE}${toQueryString(params)}`);
}

export function adminListCorrections(params: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return apiFetch<
    ApiSuccess<{ corrections: AttendanceCorrection[]; pagination: PaginationInfo }>
  >(`${API_ENDPOINTS.ATTENDANCE_CORRECTIONS.ADMIN_LIST}${toQueryString(params)}`);
}

export function approveCorrection(id: string, comment?: string) {
  return apiFetch<ApiSuccess<{ correction: AttendanceCorrection }>>(
    API_ENDPOINTS.ATTENDANCE_CORRECTIONS.APPROVE(id),
    { method: "PATCH", body: JSON.stringify({ comment }) }
  );
}

export function rejectCorrection(id: string, comment?: string) {
  return apiFetch<ApiSuccess<{ correction: AttendanceCorrection }>>(
    API_ENDPOINTS.ATTENDANCE_CORRECTIONS.REJECT(id),
    { method: "PATCH", body: JSON.stringify({ comment }) }
  );
}
