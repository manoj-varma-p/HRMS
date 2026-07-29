import { Schema, model, Document, Types } from "mongoose";
import { LEAVE_TYPES, LeaveType } from "../../shared/constants/leaveTypes";

export const ALLOCATION_PERIOD = {
  H1: "H1",
  H2: "H2",
  ANNUAL: "ANNUAL",
} as const;
export type AllocationPeriod = (typeof ALLOCATION_PERIOD)[keyof typeof ALLOCATION_PERIOD];

export interface ILeaveAllocation extends Document {
  employee: Types.ObjectId;
  leaveType: LeaveType;
  period: AllocationPeriod;
  year: number;
  days: number;
  reason: string;
  grantedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const leaveAllocationSchema = new Schema<ILeaveAllocation>(
  {
    employee: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    leaveType: {
      type: String,
      enum: [LEAVE_TYPES.SICK, LEAVE_TYPES.CASUAL_PAID, LEAVE_TYPES.ANNUAL],
      required: true,
    },
    period: {
      type: String,
      enum: Object.values(ALLOCATION_PERIOD),
      required: true,
    },
    year: { type: Number, required: true },
    days: { type: Number, required: true, min: 0.5 },
    reason: { type: String, required: true, trim: true },
    grantedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const LeaveAllocationModel = model<ILeaveAllocation>(
  "LeaveAllocation",
  leaveAllocationSchema
);
