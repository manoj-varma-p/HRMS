import { Schema, model, Document, Types } from "mongoose";

// One document per employee per year — this is what makes "no carry-forward"
// automatic: a new year has no document yet, so used counts start at 0
// without needing an explicit reset job.
export interface ILeaveBalance extends Document {
  employee: Types.ObjectId;
  year: number;
  sickUsed: number;
  // Casual Paid Leave is tracked per half-year bucket (Jan-Jun / Jul-Dec)
  // rather than one annual counter, so H1's unused days can carry into H2
  // without also letting H2's usage silently draw down H1's quota.
  casualPaidUsedH1: number;
  casualPaidUsedH2: number;
  annualUsed: number;
  unpaidUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

const leaveBalanceSchema = new Schema<ILeaveBalance>(
  {
    employee: { type: Schema.Types.ObjectId, ref: "User", required: true },
    year: { type: Number, required: true },
    sickUsed: { type: Number, required: true, default: 0 },
    casualPaidUsedH1: { type: Number, required: true, default: 0 },
    casualPaidUsedH2: { type: Number, required: true, default: 0 },
    annualUsed: { type: Number, required: true, default: 0 },
    unpaidUsed: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

leaveBalanceSchema.index({ employee: 1, year: 1 }, { unique: true });

export const LeaveBalanceModel = model<ILeaveBalance>(
  "LeaveBalance",
  leaveBalanceSchema
);
