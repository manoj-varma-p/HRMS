export const ANNOUNCEMENT_PRIORITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
} as const;
export type AnnouncementPriority =
  (typeof ANNOUNCEMENT_PRIORITY)[keyof typeof ANNOUNCEMENT_PRIORITY];

export const ANNOUNCEMENT_STATUS = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
} as const;
export type AnnouncementStatus =
  (typeof ANNOUNCEMENT_STATUS)[keyof typeof ANNOUNCEMENT_STATUS];
