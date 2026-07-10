import { Schema, model, Document, Types } from "mongoose";
import { NOTIFICATION_TYPES, NotificationType } from "../../shared/constants/notificationTypes";

export interface INotification extends Document {
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: Object.values(NOTIFICATION_TYPES), required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    read: { type: Boolean, required: true, default: false },
    metadata: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Every read path filters by user and sorts/counts by read state — a
// single compound index serves the list, unread-count, and mark-all-read
// queries without a separate index per query shape.
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export const NotificationModel = model<INotification>("Notification", notificationSchema);
