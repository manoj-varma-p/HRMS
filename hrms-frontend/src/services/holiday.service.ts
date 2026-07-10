import { apiFetch } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { Holiday } from "@/types/leave.types";

type ApiSuccess<T> = { success: true; message: string; data: T };

export function listHolidays(params: { includeInactive?: boolean; year?: number } = {}) {
  const search = new URLSearchParams();
  if (params.includeInactive) search.set("includeInactive", "true");
  if (params.year) search.set("year", String(params.year));
  const qs = search.toString();
  return apiFetch<ApiSuccess<{ holidays: Holiday[] }>>(
    `${API_ENDPOINTS.HOLIDAYS.LIST}${qs ? `?${qs}` : ""}`
  ).then((res) => res.data.holidays);
}

export function createHoliday(input: {
  date: string;
  name: string;
  description?: string;
  type: string;
}) {
  return apiFetch<ApiSuccess<{ holiday: Holiday }>>(API_ENDPOINTS.HOLIDAYS.CREATE, {
    method: "POST",
    body: JSON.stringify(input),
  }).then((res) => res.data.holiday);
}

export function updateHoliday(
  id: string,
  input: Partial<{ date: string; name: string; description: string | null; type: string }>
) {
  return apiFetch<ApiSuccess<{ holiday: Holiday }>>(API_ENDPOINTS.HOLIDAYS.UPDATE(id), {
    method: "PATCH",
    body: JSON.stringify(input),
  }).then((res) => res.data.holiday);
}

export function activateHoliday(id: string) {
  return apiFetch<ApiSuccess<{ holiday: Holiday }>>(API_ENDPOINTS.HOLIDAYS.ACTIVATE(id), {
    method: "PATCH",
  }).then((res) => res.data.holiday);
}

export function deactivateHoliday(id: string) {
  return apiFetch<ApiSuccess<{ holiday: Holiday }>>(API_ENDPOINTS.HOLIDAYS.DEACTIVATE(id), {
    method: "PATCH",
  }).then((res) => res.data.holiday);
}
