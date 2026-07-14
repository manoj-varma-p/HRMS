import { Schema, model, Document, Types } from "mongoose";

export const DOCUMENT_CATEGORY = {
  IDENTITY: "IDENTITY",
  EDUCATION: "EDUCATION",
  EMPLOYMENT: "EMPLOYMENT",
  FINANCE: "FINANCE",
  OTHER: "OTHER",
} as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORY)[keyof typeof DOCUMENT_CATEGORY];

export const DOCUMENT_STATUS = {
  ACTIVE: "ACTIVE",
  DELETED: "DELETED",
} as const;
export type EmployeeDocumentStatus = (typeof DOCUMENT_STATUS)[keyof typeof DOCUMENT_STATUS];

// Separate from `status` above (which is the soft-delete lifecycle) — this
// is the admin sign-off on the document's content. Self-uploads by the
// employee start PENDING; a document an admin uploads on someone else's
// behalf is auto-APPROVED (the admin doing the upload IS the review).
export const DOCUMENT_REVIEW_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;
export type DocumentReviewStatus =
  (typeof DOCUMENT_REVIEW_STATUS)[keyof typeof DOCUMENT_REVIEW_STATUS];

export interface IEmployeeDocument extends Document {
  employee: Types.ObjectId;
  category: DocumentCategory;
  originalFileName: string;
  s3Key: string;
  mimeType: string;
  fileSizeBytes: number;
  status: EmployeeDocumentStatus;
  uploadedBy: Types.ObjectId;
  deletedBy: Types.ObjectId | null;
  deletedAt: Date | null;
  reviewStatus: DocumentReviewStatus;
  reviewedBy: Types.ObjectId | null;
  reviewedAt: Date | null;
  reviewComment: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const employeeDocumentSchema = new Schema<IEmployeeDocument>(
  {
    employee: { type: Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, enum: Object.values(DOCUMENT_CATEGORY), required: true },
    originalFileName: { type: String, required: true, trim: true },
    s3Key: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSizeBytes: { type: Number, required: true },
    status: {
      type: String,
      enum: Object.values(DOCUMENT_STATUS),
      required: true,
      default: DOCUMENT_STATUS.ACTIVE,
    },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    deletedAt: { type: Date, default: null },
    reviewStatus: {
      type: String,
      enum: Object.values(DOCUMENT_REVIEW_STATUS),
      required: true,
      default: DOCUMENT_REVIEW_STATUS.PENDING,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    reviewComment: { type: String, default: null },
  },
  { timestamps: true }
);

// Every read path filters by employee, most also filter by status (the
// "hide deleted by default" list view) — one compound index serves both.
employeeDocumentSchema.index({ employee: 1, status: 1, createdAt: -1 });

export const EmployeeDocumentModel = model<IEmployeeDocument>(
  "EmployeeDocument",
  employeeDocumentSchema
);
