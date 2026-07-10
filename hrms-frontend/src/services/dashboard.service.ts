import { apiFetch } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { AdminDashboard } from "@/types/dashboard.types";

type ApiSuccess<T> = { success: true; message: string; data: T };

export function getAdminDashboard() {
  return apiFetch<ApiSuccess<AdminDashboard>>(API_ENDPOINTS.DASHBOARD.ADMIN);
}
