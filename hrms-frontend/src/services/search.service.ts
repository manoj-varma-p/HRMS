import { apiFetch } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { GlobalSearchResult } from "@/types/report.types";

type ApiSuccess<T> = { success: true; message: string; data: T };

export function globalSearch(q: string) {
  return apiFetch<ApiSuccess<GlobalSearchResult>>(
    `${API_ENDPOINTS.SEARCH}?q=${encodeURIComponent(q)}`
  );
}
