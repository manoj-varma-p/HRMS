import { Schema, model, Document, Types } from "mongoose";

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

export interface IAnnouncement extends Document {
  title: string;
  description: string;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  expiryDate: string | null; // "YYYY-MM-DD" in IST, inclusive
  createdBy: Types.ObjectId;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    priority: {
      type: String,
      enum: Object.values(ANNOUNCEMENT_PRIORITY),
      required: true,
      default: ANNOUNCEMENT_PRIORITY.MEDIUM,
    },
    status: {
      type: String,
      enum: Object.values(ANNOUNCEMENT_STATUS),
      required: true,
      default: ANNOUNCEMENT_STATUS.DRAFT,
    },
    expiryDate: { type: String, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

announcementSchema.index({ status: 1, expiryDate: 1, createdAt: -1 });

export const AnnouncementModel = model<IAnnouncement>("Announcement", announcementSchema);
