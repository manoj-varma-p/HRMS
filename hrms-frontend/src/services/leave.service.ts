import { apiFetch } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { LeaveBalance, LeaveRequest, PaginationInfo } from "@/types/leave.types";

type ApiSuccess<T> = { success: true; message: string; data: T };

function toQueryString(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export interface ApplyLeaveInput {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export function applyLeave(input: ApplyLeaveInput) {
  return apiFetch<ApiSuccess<{ leave: LeaveRequest }>>(API_ENDPOINTS.LEAVES.APPLY, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface ListLeavesParams {
  page?: number;
  limit?: number;
  status?: string;
  leaveType?: string;
  year?: number;
}

export function myLeaves(params: ListLeavesParams) {
  return apiFetch<ApiSuccess<{ leaves: LeaveRequest[]; pagination: PaginationInfo }>>(
    `${API_ENDPOINTS.LEAVES.MINE}${toQueryString({ ...params })}`
  );
}

export interface AdminListLeavesParams extends ListLeavesParams {
  employeeId?: string;
  department?: string;
  designation?: string;
}

export function adminListLeaves(params: AdminListLeavesParams) {
  return apiFetch<ApiSuccess<{ leaves: LeaveRequest[]; pagination: PaginationInfo }>>(
    `${API_ENDPOINTS.LEAVES.ADMIN_LIST}${toQueryString({ ...params })}`
  );
}

export function getBalance(params: { employeeId?: string; year?: number } = {}) {
  return apiFetch<ApiSuccess<LeaveBalance>>(
    `${API_ENDPOINTS.LEAVES.BALANCE}${toQueryString({ ...params })}`
  );
}

export function cancelLeave(id: string) {
  return apiFetch<ApiSuccess<{ leave: LeaveRequest }>>(API_ENDPOINTS.LEAVES.CANCEL(id), {
    method: "PATCH",
  });
}

export function approveLeave(id: string, comment?: string) {
  return apiFetch<ApiSuccess<{ leave: LeaveRequest }>>(API_ENDPOINTS.LEAVES.APPROVE(id), {
    method: "PATCH",
    body: JSON.stringify({ comment }),
  });
}

export function rejectLeave(id: string, comment?: string) {
  return apiFetch<ApiSuccess<{ leave: LeaveRequest }>>(API_ENDPOINTS.LEAVES.REJECT(id), {
    method: "PATCH",
    body: JSON.stringify({ comment }),
  });
}

export interface GrantExtraLeaveInput {
  employeeId: string;
  days: number;
  reason: string;
  leaveType?: string;
  period?: string;
  year?: number;
}

export interface LeaveAllocationItem {
  id: string;
  employee: {
    id: string;
    employeeId: string;
    fullName: string;
    profilePhoto: string | null;
  };
  leaveType: string;
  period: string;
  year: number;
  days: number;
  reason: string;
  grantedBy: string;
  createdAt: string;
}

export function grantExtraLeave(input: GrantExtraLeaveInput) {
  return apiFetch<ApiSuccess<{ allocation: LeaveAllocationItem }>>(
    API_ENDPOINTS.LEAVES.ALLOCATIONS,
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
}

export function listLeaveAllocations(params: { employeeId?: string; year?: number } = {}) {
  return apiFetch<ApiSuccess<{ allocations: LeaveAllocationItem[] }>>(
    `${API_ENDPOINTS.LEAVES.ALLOCATIONS}${toQueryString({ ...params })}`
  );
}

export function updateLeaveAllocation(
  id: string,
  input: { days?: number; reason?: string }
) {
  return apiFetch<ApiSuccess<{ allocation: LeaveAllocationItem }>>(
    `${API_ENDPOINTS.LEAVES.ALLOCATIONS}/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(input),
    }
  );
}

export function deleteLeaveAllocation(id: string) {
  return apiFetch<ApiSuccess<{ id: string }>>(
    `${API_ENDPOINTS.LEAVES.ALLOCATIONS}/${id}`,
    {
      method: "DELETE",
    }
  );
}
