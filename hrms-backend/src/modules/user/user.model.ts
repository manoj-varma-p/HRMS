import { Schema, model, Document, Types } from "mongoose";
import { ROLES, Role } from "../../shared/constants/roles";
import { EMPLOYEE_STATUS, EmployeeStatus } from "../../shared/constants/employeeStatus";
import { EMPLOYMENT_TYPE, EmploymentType } from "../../shared/constants/employmentType";

export interface IEmergencyContact {
  name: string;
  phone: string;
}

export interface IUser extends Document {
  employeeId: string;
  email: string;
  passwordHash: string;
  role: Role;
  status: EmployeeStatus;
  mustChangePassword: boolean;
  refreshTokenHash: string | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  // Forgot-password link flow: a sha256 digest of the raw token embedded
  // in the emailed reset URL (the raw token itself is never stored, same
  // principle as passwordHash) plus its expiry. Both null once unused or
  // already consumed.
  passwordResetTokenHash: string | null;
  passwordResetExpiresAt: Date | null;

  fullName: string;
  phone: string;
  department: Types.ObjectId | null;
  designation: Types.ObjectId | null;
  joiningDate: Date;
  dateOfBirth: Date | null;
  profilePhoto: string | null;
  address: string | null;
  emergencyContact: IEmergencyContact | null;
  // Per-employee attendance grace period, in minutes. null (the default)
  // means "use Configuration.officeSettings.gracePeriodMinutes" — this
  // only overrides the company-wide value for this one employee.
  gracePeriodOverrideMinutes: number | null;
  // Everyone starts on Probation; permanentSince is set the moment an
  // admin promotes them and is the reference point Annual Leave accrual
  // counts eligible months from (see leave.service.ts) — Probation
  // employees don't accrue Annual Leave at all.
  employmentType: EmploymentType;
  permanentSince: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const emergencyContactSchema = new Schema<IEmergencyContact>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    employeeId: { type: String, required: true, unique: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
      default: ROLES.EMPLOYEE,
    },
    status: {
      type: String,
      enum: Object.values(EMPLOYEE_STATUS),
      required: true,
      default: EMPLOYEE_STATUS.ACTIVE,
    },
    mustChangePassword: { type: Boolean, required: true, default: true },
    refreshTokenHash: { type: String, default: null, select: false },
    // Login-lockout bookkeeping (Phase 9 Security Settings) — kept off
    // default selects like the other auth-internal fields above.
    failedLoginAttempts: { type: Number, required: true, default: 0, select: false },
    lockedUntil: { type: Date, default: null, select: false },
    passwordResetTokenHash: { type: String, default: null, select: false },
    passwordResetExpiresAt: { type: Date, default: null, select: false },

    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    department: { type: Schema.Types.ObjectId, ref: "Department", default: null },
    designation: { type: Schema.Types.ObjectId, ref: "Designation", default: null },
    joiningDate: { type: Date, required: true },
    dateOfBirth: { type: Date, default: null },
    profilePhoto: { type: String, default: null },
    address: { type: String, default: null, trim: true },
    emergencyContact: { type: emergencyContactSchema, default: null },
    gracePeriodOverrideMinutes: { type: Number, default: null },
    employmentType: {
      type: String,
      enum: Object.values(EMPLOYMENT_TYPE),
      required: true,
      default: EMPLOYMENT_TYPE.PROBATION,
    },
    permanentSince: { type: Date, default: null },
  },
  { timestamps: true }
);

export const UserModel = model<IUser>("User", userSchema);
