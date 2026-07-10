import { Schema, model, Document } from "mongoose";

export const HOLIDAY_TYPES = {
  NATIONAL: "NATIONAL",
  COMPANY: "COMPANY",
  OPTIONAL: "OPTIONAL",
} as const;

export type HolidayType = (typeof HOLIDAY_TYPES)[keyof typeof HOLIDAY_TYPES];

export interface IHoliday extends Document {
  date: string; // "YYYY-MM-DD" in IST
  name: string;
  description: string | null;
  type: HolidayType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const holidaySchema = new Schema<IHoliday>(
  {
    date: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: null, trim: true },
    type: {
      type: String,
      enum: Object.values(HOLIDAY_TYPES),
      required: true,
      default: HOLIDAY_TYPES.COMPANY,
    },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

export const HolidayModel = model<IHoliday>("Holiday", holidaySchema);
