import { apiFetch } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { ActivityListResult } from "@/types/activity.types";

type ApiSuccess<T> = { success: true; message: string; data: T };

function toQueryString(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export interface ListActivityParams {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  action?: string;
  targetType?: string;
}

export function listActivity(params: ListActivityParams) {
  return apiFetch<ApiSuccess<ActivityListResult>>(
    `${API_ENDPOINTS.ACTIVITY.LIST}${toQueryString({ ...params })}`
  );
}
