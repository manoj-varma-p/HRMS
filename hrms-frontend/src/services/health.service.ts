import { apiFetch } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";

export type HealthData = {
  timestamp: string;
};

export function getHealth() {
  return apiFetch<{ success: true; message: string; data: HealthData }>(
    API_ENDPOINTS.HEALTH
  );
}
