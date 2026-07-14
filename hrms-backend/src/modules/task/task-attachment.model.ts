import { Schema, model, Document, Types } from "mongoose";

// Mirrors EmployeeDocument's shape field-for-field (documents/document.model.ts)
// rather than generalizing that model to support two owner types. Reuses
// the same S3 client functions, but as its own collection — touching
// EmployeeDocument's owner shape would risk regressing a module that
// already handles sensitive employee documents, for a module (Tasks) that
// doesn't need its review-status workflow at all. See Phase 0/1 design
// discussion.
export const TASK_ATTACHMENT_STATUS = {
  ACTIVE: "ACTIVE",
  DELETED: "DELETED",
} as const;
export type TaskAttachmentStatus =
  (typeof TASK_ATTACHMENT_STATUS)[keyof typeof TASK_ATTACHMENT_STATUS];

export interface ITaskAttachment extends Document {
  task: Types.ObjectId;
  originalFileName: string;
  s3Key: string;
  mimeType: string;
  fileSizeBytes: number;
  status: TaskAttachmentStatus;
  uploadedBy: Types.ObjectId;
  deletedBy: Types.ObjectId | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const taskAttachmentSchema = new Schema<ITaskAttachment>(
  {
    task: { type: Schema.Types.ObjectId, ref: "Task", required: true },
    originalFileName: { type: String, required: true, trim: true },
    s3Key: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSizeBytes: { type: Number, required: true },
    status: {
      type: String,
      enum: Object.values(TASK_ATTACHMENT_STATUS),
      required: true,
      default: TASK_ATTACHMENT_STATUS.ACTIVE,
    },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

taskAttachmentSchema.index({ task: 1, status: 1, createdAt: -1 });

export const TaskAttachmentModel = model<ITaskAttachment>(
  "TaskAttachment",
  taskAttachmentSchema
);
