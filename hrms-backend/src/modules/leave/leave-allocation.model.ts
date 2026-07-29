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
      enum: Object.values(LEAVE_TYPES),
      default: LEAVE_TYPES.COMP_OFF,
    },
    period: {
      type: String,
      enum: Object.values(ALLOCATION_PERIOD),
      default: ALLOCATION_PERIOD.ANNUAL,
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
