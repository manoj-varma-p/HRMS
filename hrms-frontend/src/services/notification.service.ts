import { apiFetch } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { Notification, NotificationListResult } from "@/types/notification.types";

type ApiSuccess<T> = { success: true; message: string; data: T };

function toQueryString(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export interface ListNotificationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export function listNotifications(params: ListNotificationsParams) {
  return apiFetch<ApiSuccess<NotificationListResult>>(
    `${API_ENDPOINTS.NOTIFICATIONS.LIST}${toQueryString({ ...params })}`
  );
}

export function getUnreadCount() {
  return apiFetch<ApiSuccess<{ count: number }>>(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
}

export function markRead(id: string) {
  return apiFetch<ApiSuccess<{ notification: Notification }>>(
    API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id),
    { method: "PATCH" }
  );
}

export function markAllRead() {
  return apiFetch<ApiSuccess<{ modifiedCount: number }>>(
    API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ,
    { method: "PATCH" }
  );
}
