import { Schema, model, Document, Types } from "mongoose";
import {
  ATTENDANCE_STATUS,
  AttendanceStatus,
} from "../../shared/constants/attendanceStatus";

// Only statuses that can be determined from a real check-in/out record are
// ever persisted here. ABSENT / WEEKEND / HOLIDAY / ON_LEAVE apply to days
// with no record at all and are synthesized at read time (see
// attendance.service.ts) — storing them would mean writing a row for every
// employee on every day that nothing happened, which doesn't scale and
// isn't necessary since "no row" already means one of those four.
export type StoredAttendanceStatus =
  | typeof ATTENDANCE_STATUS.ON_TIME
  | typeof ATTENDANCE_STATUS.LATE
  | typeof ATTENDANCE_STATUS.HALF_DAY;

export interface IAttendance extends Document {
  employee: Types.ObjectId;
  date: string; // "YYYY-MM-DD" in IST — one document per employee per day
  checkIn: Date | null;
  checkOut: Date | null;
  workedHours: number | null;
  status: StoredAttendanceStatus;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    employee: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    checkIn: { type: Date, default: null },
    checkOut: { type: Date, default: null },
    workedHours: { type: Number, default: null },
    status: {
      type: String,
      enum: [
        ATTENDANCE_STATUS.ON_TIME,
        ATTENDANCE_STATUS.LATE,
        ATTENDANCE_STATUS.HALF_DAY,
      ],
      required: true,
    },
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

export const AttendanceModel = model<IAttendance>("Attendance", attendanceSchema);

export type { AttendanceStatus };
