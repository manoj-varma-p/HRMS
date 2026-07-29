import { Schema, model, Document, Types } from "mongoose";

// One document per employee per year — this is what makes "no carry-forward"
// automatic: a new year has no document yet, so used counts start at 0
// without needing an explicit reset job.
export interface ILeaveBalance extends Document {
  employee: Types.ObjectId;
  year: number;
  // Sick and Casual Paid Leave are both tracked per half-year bucket
  // (Jan-Jun / Jul-Dec) rather than one annual counter, so H1's unused
  // days can carry into H2 without also letting H2's usage silently draw
  // down H1's quota.
  sickUsedH1: number;
  sickUsedH2: number;
  sickExtraH1: number;
  sickExtraH2: number;
  casualPaidUsedH1: number;
  casualPaidUsedH2: number;
  casualPaidExtraH1: number;
  casualPaidExtraH2: number;
  // Annual Leave is a real stored balance (unlike Sick/Casual, whose
  // *quota* is fixed by policy) — it's credited incrementally, flat
  // +policy.annualAccrualPerMonth for every fully-completed calendar month
  // the employee has been Permanent, no other condition. annualAccrued is
  // the running total; annualAccruedThroughMonth (1-12, 0 = none yet) is
  // how many months of this year have already been credited, so repeated
  // reads/writes never double-credit the same month. See leave.service.ts.
  annualAccrued: number;
  annualAccruedThroughMonth: number;
  annualExtra: number;
  annualUsed: number;
  unpaidUsed: number;
  compOffGranted: number;
  compOffUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

const leaveBalanceSchema = new Schema<ILeaveBalance>(
  {
    employee: { type: Schema.Types.ObjectId, ref: "User", required: true },
    year: { type: Number, required: true },
    sickUsedH1: { type: Number, required: true, default: 0 },
    sickUsedH2: { type: Number, required: true, default: 0 },
    sickExtraH1: { type: Number, required: true, default: 0 },
    sickExtraH2: { type: Number, required: true, default: 0 },
    casualPaidUsedH1: { type: Number, required: true, default: 0 },
    casualPaidUsedH2: { type: Number, required: true, default: 0 },
    casualPaidExtraH1: { type: Number, required: true, default: 0 },
    casualPaidExtraH2: { type: Number, required: true, default: 0 },
    annualAccrued: { type: Number, required: true, default: 0 },
    annualAccruedThroughMonth: { type: Number, required: true, default: 0 },
    annualExtra: { type: Number, required: true, default: 0 },
    annualUsed: { type: Number, required: true, default: 0 },
    unpaidUsed: { type: Number, required: true, default: 0 },
    compOffGranted: { type: Number, required: true, default: 0 },
    compOffUsed: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

leaveBalanceSchema.index({ employee: 1, year: 1 }, { unique: true });

export const LeaveBalanceModel = model<ILeaveBalance>(
  "LeaveBalance",
  leaveBalanceSchema
);
