import { Schema, model, Document, Types } from "mongoose";

export const CORRECTION_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type CorrectionStatus =
  (typeof CORRECTION_STATUS)[keyof typeof CORRECTION_STATUS];

export interface IAttendanceCorrection extends Document {
  employee: Types.ObjectId;
  date: string; // "YYYY-MM-DD" in IST, the attendance day being corrected
  requestedCheckIn: Date | null;
  requestedCheckOut: Date | null;
  reason: string;
  status: CorrectionStatus;
  reviewedBy: Types.ObjectId | null;
  reviewComment: string | null;
  // Audit trail: what the attendance record looked like at request time,
  // before any correction was applied.
  originalCheckIn: Date | null;
  originalCheckOut: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceCorrectionSchema = new Schema<IAttendanceCorrection>(
  {
    employee: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    requestedCheckIn: { type: Date, default: null },
    requestedCheckOut: { type: Date, default: null },
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: Object.values(CORRECTION_STATUS),
      required: true,
      default: CORRECTION_STATUS.PENDING,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewComment: { type: String, default: null },
    originalCheckIn: { type: Date, default: null },
    originalCheckOut: { type: Date, default: null },
  },
  { timestamps: true }
);

attendanceCorrectionSchema.index({ employee: 1, createdAt: -1 });
attendanceCorrectionSchema.index({ status: 1 });

export const AttendanceCorrectionModel = model<IAttendanceCorrection>(
  "AttendanceCorrection",
  attendanceCorrectionSchema
);
