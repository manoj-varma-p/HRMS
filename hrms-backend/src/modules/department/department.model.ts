import { Schema, model, Document, Types } from "mongoose";

export interface IDepartment extends Document {
  name: string;
  isActive: boolean;
  // Department Head: whoever this points at gets team-scoped task
  // permissions (see Task module). Not a role — an ordinary EMPLOYEE or
  // ADMIN can be a head; this is purely a relationship, checked per
  // request. null means the department currently has no head.
  headEmployeeId: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    isActive: { type: Boolean, required: true, default: true },
    headEmployeeId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
  },
  { timestamps: true }
);

export const DepartmentModel = model<IDepartment>("Department", departmentSchema);
