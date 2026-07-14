import { apiFetch } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { createReferenceDataService } from "./reference-data.service";
import { DepartmentWithHead } from "@/types/department.types";

type ApiSuccess<T> = { success: true; message: string; data: T };

export const departmentService = createReferenceDataService(
  API_ENDPOINTS.DEPARTMENTS,
  "departments",
  "department"
);

// Same GET /departments the generic service above calls — the response
// already includes the populated head (backend always returns it), this
// just types the richer shape for the Department Head picker rather than
// the plain {_id, name, isActive} the generic service types it as.
export function listDepartmentsWithHead(includeInactive = false) {
  const qs = includeInactive ? "?includeInactive=true" : "";
  return apiFetch<ApiSuccess<{ departments: DepartmentWithHead[] }>>(
    `${API_ENDPOINTS.DEPARTMENTS.LIST}${qs}`
  ).then((res) => res.data.departments);
}

export function setDepartmentHead(id: string, headEmployeeId: string | null) {
  return apiFetch<ApiSuccess<{ department: DepartmentWithHead }>>(
    API_ENDPOINTS.DEPARTMENTS.SET_HEAD(id),
    { method: "PATCH", body: JSON.stringify({ headEmployeeId }) }
  ).then((res) => res.data.department);
}
