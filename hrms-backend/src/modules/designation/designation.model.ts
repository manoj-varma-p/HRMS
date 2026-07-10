import { Schema, model, Document } from "mongoose";

export interface IDesignation extends Document {
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const designationSchema = new Schema<IDesignation>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

export const DesignationModel = model<IDesignation>("Designation", designationSchema);
