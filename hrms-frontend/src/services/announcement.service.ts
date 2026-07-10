import { apiFetch } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { Announcement, AnnouncementListResult } from "@/types/announcement.types";

type ApiSuccess<T> = { success: true; message: string; data: T };

function toQueryString(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export interface ListAnnouncementsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export function listAnnouncements(params: ListAnnouncementsParams) {
  return apiFetch<ApiSuccess<AnnouncementListResult>>(
    `${API_ENDPOINTS.ANNOUNCEMENTS.LIST}${toQueryString({ ...params })}`
  );
}

export function getRecentAnnouncements() {
  return apiFetch<ApiSuccess<{ announcements: Announcement[] }>>(
    API_ENDPOINTS.ANNOUNCEMENTS.RECENT
  );
}

export interface AdminListAnnouncementsParams extends ListAnnouncementsParams {
  status?: string;
  priority?: string;
}

export function adminListAnnouncements(params: AdminListAnnouncementsParams) {
  return apiFetch<ApiSuccess<AnnouncementListResult>>(
    `${API_ENDPOINTS.ANNOUNCEMENTS.ADMIN_LIST}${toQueryString({ ...params })}`
  );
}

export function getAnnouncement(id: string) {
  return apiFetch<ApiSuccess<{ announcement: Announcement }>>(
    API_ENDPOINTS.ANNOUNCEMENTS.DETAIL(id)
  );
}

export interface CreateAnnouncementInput {
  title: string;
  description: string;
  priority: string;
  expiryDate?: string;
}

export function createAnnouncement(input: CreateAnnouncementInput) {
  return apiFetch<ApiSuccess<{ announcement: Announcement }>>(
    API_ENDPOINTS.ANNOUNCEMENTS.CREATE,
    { method: "POST", body: JSON.stringify(input) }
  );
}

export interface UpdateAnnouncementInput {
  title?: string;
  description?: string;
  priority?: string;
  expiryDate?: string | null;
}

export function updateAnnouncement(id: string, input: UpdateAnnouncementInput) {
  return apiFetch<ApiSuccess<{ announcement: Announcement }>>(
    API_ENDPOINTS.ANNOUNCEMENTS.UPDATE(id),
    { method: "PATCH", body: JSON.stringify(input) }
  );
}

export function publishAnnouncement(id: string) {
  return apiFetch<ApiSuccess<{ announcement: Announcement }>>(
    API_ENDPOINTS.ANNOUNCEMENTS.PUBLISH(id),
    { method: "PATCH" }
  );
}

export function archiveAnnouncement(id: string) {
  return apiFetch<ApiSuccess<{ announcement: Announcement }>>(
    API_ENDPOINTS.ANNOUNCEMENTS.ARCHIVE(id),
    { method: "PATCH" }
  );
}
