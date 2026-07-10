import { AnnouncementPriority, AnnouncementStatus } from "@/constants/announcement";

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  expiryDate: string | null;
  createdBy: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementListResult {
  announcements: Announcement[];
  pagination: PaginationInfo;
}
