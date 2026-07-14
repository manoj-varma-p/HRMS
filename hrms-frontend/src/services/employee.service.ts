import { apiFetch } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { Employee, EmployeeListResult } from "@/types/employee.types";

type ApiSuccess<T> = { success: true; message: string; data: T };

export interface ListEmployeesParams {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  designation?: string;
  role?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

function toQueryString(params: Record<string, unknown>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function listEmployees(params: ListEmployeesParams) {
  return apiFetch<ApiSuccess<EmployeeListResult>>(
    `${API_ENDPOINTS.EMPLOYEES.LIST}${toQueryString({ ...params })}`
  );
}

export interface CreateEmployeeInput {
  fullName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joiningDate: string;
  role: string;
  status?: string;
}

export function createEmployee(input: CreateEmployeeInput) {
  return apiFetch<ApiSuccess<{ employee: Employee; tempPassword: string }>>(
    API_ENDPOINTS.EMPLOYEES.CREATE,
    { method: "POST", body: JSON.stringify(input) }
  );
}

export function getEmployee(id: string) {
  return apiFetch<ApiSuccess<{ employee: Employee }>>(
    API_ENDPOINTS.EMPLOYEES.DETAIL(id)
  );
}

export interface UpdateEmployeeInput {
  fullName?: string;
  phone?: string;
  department?: string;
  designation?: string;
  dateOfBirth?: string;
  gracePeriodOverrideMinutes?: number | null;
  role?: string;
  status?: string;
}

export function updateEmployee(id: string, input: UpdateEmployeeInput) {
  return apiFetch<ApiSuccess<{ employee: Employee }>>(
    API_ENDPOINTS.EMPLOYEES.DETAIL(id),
    { method: "PATCH", body: JSON.stringify(input) }
  );
}

export function activateEmployee(id: string) {
  return apiFetch<ApiSuccess<{ employee: Employee }>>(
    API_ENDPOINTS.EMPLOYEES.ACTIVATE(id),
    { method: "PATCH" }
  );
}

export function deactivateEmployee(id: string) {
  return apiFetch<ApiSuccess<{ employee: Employee }>>(
    API_ENDPOINTS.EMPLOYEES.DEACTIVATE(id),
    { method: "PATCH" }
  );
}

export function promoteToPermanent(id: string) {
  return apiFetch<ApiSuccess<{ employee: Employee }>>(
    API_ENDPOINTS.EMPLOYEES.PROMOTE_TO_PERMANENT(id),
    { method: "PATCH" }
  );
}

export function deleteEmployee(id: string) {
  return apiFetch<ApiSuccess<null>>(API_ENDPOINTS.EMPLOYEES.DETAIL(id), {
    method: "DELETE",
  });
}

export function getMyProfile() {
  return apiFetch<ApiSuccess<{ employee: Employee }>>(API_ENDPOINTS.EMPLOYEES.ME);
}

export interface UpdateProfileInput {
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  profilePhoto?: string;
  emergencyContact?: { name: string; phone: string };
}

export function updateMyProfile(input: UpdateProfileInput) {
  return apiFetch<ApiSuccess<{ employee: Employee }>>(API_ENDPOINTS.EMPLOYEES.ME, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
