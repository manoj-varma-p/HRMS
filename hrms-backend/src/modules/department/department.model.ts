import { Schema, model, Document } from "mongoose";

export interface IDepartment extends Document {
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

export const DepartmentModel = model<IDepartment>("Department", departmentSchema);
