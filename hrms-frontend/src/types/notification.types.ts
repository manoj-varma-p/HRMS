import { NotificationType } from "@/constants/notification-types";

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface NotificationListResult {
  notifications: Notification[];
  unreadCount: number;
  pagination: PaginationInfo;
}
