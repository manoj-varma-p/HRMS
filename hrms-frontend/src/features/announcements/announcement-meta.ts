import { AnnouncementPriority, AnnouncementStatus } from "@/constants/announcement";

export const PRIORITY_LABELS: Record<AnnouncementPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const PRIORITY_BADGE: Record<AnnouncementPriority, string> = {
  LOW: "bg-muted text-muted-foreground border-transparent",
  MEDIUM: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-transparent",
  HIGH: "bg-red-500/10 text-red-600 dark:text-red-400 border-transparent",
};

export const STATUS_LABELS: Record<AnnouncementStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export const STATUS_BADGE: Record<AnnouncementStatus, string> = {
  DRAFT: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-transparent",
  PUBLISHED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent",
  ARCHIVED: "bg-muted text-muted-foreground border-transparent",
};
