import mongoose from "mongoose";
import { ApiError } from "../../shared/errors/ApiError";
import { env } from "../../shared/config/env";
import { ROLES, Role } from "../../shared/constants/roles";
import {
  EMPLOYEE_STATUS,
  EmployeeStatus,
  LOGIN_ALLOWED_STATUSES,
} from "../../shared/constants/employeeStatus";
import { EMPLOYMENT_TYPE } from "../../shared/constants/employmentType";
import { ACTIVITY_ACTIONS } from "../../shared/constants/activityActions";
import { NOTIFICATION_TYPES } from "../../shared/constants/notificationTypes";
import { generateTempPassword, hashSecret } from "../../shared/utils/password";
import { toId } from "../../shared/utils/toId";
import { escapeRegex } from "../../shared/utils/regex";
import { recordActivity } from "../activity-log/activity-log.service";
import { notifyAdmins, notifyUser } from "../notifications/notifications.service";
import { NotificationModel } from "../notifications/notification.model";
import { DepartmentModel } from "../department/department.model";
import { DesignationModel } from "../designation/designation.model";
import { IUser, UserModel } from "../user/user.model";
import { CounterModel } from "../../shared/models/counter.model";
import { AttendanceModel } from "../attendance/attendance.model";
import { AttendanceCorrectionModel } from "../attendance-correction/attendance-correction.model";
import { LeaveRequestModel } from "../leave/leave-request.model";
import { LeaveBalanceModel } from "../leave/leave-balance.model";
import { purgeAllDocumentsForEmployee } from "../documents/document.service";

const EMPLOYEE_ID_PREFIX = "EMP-";
const EMPLOYEE_ID_PAD = 4;
const EMPLOYEE_ID_COUNTER = "employeeId";

interface Actor {
  id: string;
  role: Role;
  employeeId: string;
}

interface ListQuery {
  page: number;
  limit: number;
  search?: string;
  department?: string;
  designation?: string;
  role?: string;
  status?: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

function toPublicEmployee(user: IUser) {
  return {
    id: toId(user),
    employeeId: user.employeeId,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    department: user.department,
    designation: user.designation,
    role: user.role,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    joiningDate: user.joiningDate,
    dateOfBirth: user.dateOfBirth,
    profilePhoto: user.profilePhoto,
    address: user.address,
    emergencyContact: user.emergencyContact,
    gracePeriodOverrideMinutes: user.gracePeriodOverrideMinutes,
    employmentType: user.employmentType,
    permanentSince: user.permanentSince,
    createdAt: user.createdAt,
  };
}

const POPULATE_FIELDS = [
  { path: "department", select: "name isActive" },
  { path: "designation", select: "name isActive" },
];

export async function listEmployees(query: ListQuery) {
  const filter: Record<string, unknown> = {};

  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search.trim()), "i");
    filter.$or = [
      { employeeId: regex },
      { fullName: regex },
      { email: regex },
      { phone: regex },
    ];
  }
  if (query.department) filter.department = query.department;
  if (query.designation) filter.designation = query.designation;
  if (query.role) filter.role = query.role;
  if (query.status) filter.status = query.status;

  const skip = (query.page - 1) * query.limit;
  const sort: Record<string, 1 | -1> = {
    [query.sortBy]: query.sortOrder === "asc" ? 1 : -1,
  };

  const [users, total] = await Promise.all([
    UserModel.find(filter)
      .populate(POPULATE_FIELDS)
      .sort(sort)
      .skip(skip)
      .limit(query.limit),
    UserModel.countDocuments(filter),
  ]);

  return {
    employees: users.map(toPublicEmployee),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

async function assertReferenceDataExists(departmentId: string, designationId: string) {
  const [department, designation] = await Promise.all([
    DepartmentModel.findById(departmentId),
    DesignationModel.findById(designationId),
  ]);
  if (!department) throw new ApiError(400, "Selected department does not exist");
  if (!designation) throw new ApiError(400, "Selected designation does not exist");
}

interface CreateEmployeeInput {
  fullName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joiningDate: Date;
  dateOfBirth?: Date;
  role: Role;
  status: EmployeeStatus;
}

// Atomic (Mongo's standard findOneAndUpdate + $inc counter pattern), so
// concurrent employee creations can never race onto the same number. On
// first-ever use it bootstraps the counter from the highest existing
// "EMP-####" employeeId already in the database (seed/legacy data), via a
// $setOnInsert upsert that's a no-op if another request already created
// the counter first — so this stays correct under concurrency too.
async function getNextEmployeeId(): Promise<string> {
  const counterExists = await CounterModel.exists({ _id: EMPLOYEE_ID_COUNTER });
  if (!counterExists) {
    const existingIds = await UserModel.find({
      employeeId: { $regex: /^EMP-\d+$/ },
    }).select("employeeId");
    const maxSeq = existingIds.reduce((max, u) => {
      const n = Number(u.employeeId.slice(EMPLOYEE_ID_PREFIX.length));
      return Number.isFinite(n) && n > max ? n : max;
    }, 0);
    await CounterModel.updateOne(
      { _id: EMPLOYEE_ID_COUNTER },
      { $setOnInsert: { seq: maxSeq } },
      { upsert: true }
    );
  }

  const counter = await CounterModel.findByIdAndUpdate(
    EMPLOYEE_ID_COUNTER,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `${EMPLOYEE_ID_PREFIX}${String(counter!.seq).padStart(EMPLOYEE_ID_PAD, "0")}`;
}

export async function createEmployee(actor: Actor, input: CreateEmployeeInput) {
  if (actor.role === ROLES.ADMIN && input.role !== ROLES.EMPLOYEE) {
    throw new ApiError(403, "Admins can only create Employee accounts");
  }

  const existingByEmail = await UserModel.findOne({ email: input.email.toLowerCase() });
  if (existingByEmail) {
    throw new ApiError(409, `Email "${input.email}" is already in use`);
  }

  await assertReferenceDataExists(input.department, input.designation);

  const employeeId = await getNextEmployeeId();
  const tempPassword = generateTempPassword();
  const passwordHash = await hashSecret(tempPassword);

  let user: IUser;
  try {
    user = await UserModel.create({
      employeeId,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      department: input.department,
      designation: input.designation,
      joiningDate: input.joiningDate,
      dateOfBirth: input.dateOfBirth ?? null,
      role: input.role,
      status: input.status,
      passwordHash,
      mustChangePassword: true,
    });
  } catch (err) {
    // Fallback for a race between the pre-check above and the insert.
    if (isDuplicateKeyError(err)) {
      throw new ApiError(409, "Employee ID or email is already in use");
    }
    throw err;
  }

  await user.populate(POPULATE_FIELDS);

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.EMPLOYEE_CREATED,
    targetType: "User",
    targetId: toId(user),
    metadata: { employeeId: user.employeeId, role: user.role },
  });

  await notifyAdmins(actor.id, {
    type: NOTIFICATION_TYPES.EMPLOYEE_CREATED,
    title: "New employee added",
    message: `${user.fullName} (${user.employeeId}) was added to the system`,
    metadata: { employeeId: toId(user) },
  });

  // Welcome email doubles as the "temporary password" email — one email at
  // one event, rather than two near-identical messages landing at once.
  await notifyUser({
    user: toId(user),
    type: NOTIFICATION_TYPES.EMPLOYEE_CREATED,
    title: "Welcome to the team",
    message: `Your HRMS account has been created. Employee ID: ${user.employeeId}`,
    metadata: { employeeId: toId(user) },
    email: {
      template: "welcome",
      data: {
        fullName: user.fullName,
        employeeId: user.employeeId,
        email: user.email,
        tempPassword,
        loginUrl: `${env.clientOrigin}/login`,
      },
    },
  });

  return { employee: toPublicEmployee(user), tempPassword };
}

function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: number }).code === 11000
  );
}

export async function getEmployeeById(actor: Actor, id: string) {
  if (actor.role === ROLES.EMPLOYEE && actor.id !== id) {
    throw new ApiError(403, "You can only view your own information");
  }

  const user = await UserModel.findById(id).populate(POPULATE_FIELDS);
  if (!user) {
    throw new ApiError(404, "Employee not found");
  }

  return toPublicEmployee(user);
}

interface UpdateEmployeeInput {
  fullName?: string;
  phone?: string;
  department?: string;
  designation?: string;
  dateOfBirth?: Date;
  gracePeriodOverrideMinutes?: number | null;
  role?: Role;
  status?: EmployeeStatus;
}

export async function updateEmployee(
  actor: Actor,
  id: string,
  input: UpdateEmployeeInput
) {
  const user = await UserModel.findById(id);
  if (!user) {
    throw new ApiError(404, "Employee not found");
  }

  if (input.role !== undefined && input.role !== user.role) {
    // Mirrors createEmployee's rule — only a Super Admin can grant/revoke
    // Admin access. A regular Admin managing a role change (even down to
    // Employee) is refused outright rather than silently ignored, so the
    // request fails loudly instead of applying every other field change
    // and leaving the admin to wonder why the role didn't take.
    if (actor.role !== ROLES.SUPER_ADMIN) {
      throw new ApiError(403, "Only a Super Admin can change an employee's role");
    }
    // Super Admin accounts aren't manageable through this generic edit
    // form — guards against accidentally demoting the only super admin.
    if (user.role === ROLES.SUPER_ADMIN) {
      throw new ApiError(403, "A Super Admin's role cannot be changed here");
    }
  }

  if (input.department || input.designation) {
    await assertReferenceDataExists(
      input.department ?? String(user.department),
      input.designation ?? String(user.designation)
    );
  }

  const previousStatus = user.status;

  if (input.fullName !== undefined) user.fullName = input.fullName;
  if (input.phone !== undefined) user.phone = input.phone;
  if (input.department !== undefined) user.department = input.department as never;
  if (input.designation !== undefined) user.designation = input.designation as never;
  if (input.dateOfBirth !== undefined) user.dateOfBirth = input.dateOfBirth;
  if (input.gracePeriodOverrideMinutes !== undefined) {
    user.gracePeriodOverrideMinutes = input.gracePeriodOverrideMinutes;
  }
  if (input.role !== undefined) user.role = input.role;
  if (input.status !== undefined) user.status = input.status;

  if (
    input.status &&
    input.status !== previousStatus &&
    !LOGIN_ALLOWED_STATUSES.includes(input.status)
  ) {
    user.refreshTokenHash = null;
  }

  await user.save();
  await user.populate(POPULATE_FIELDS);

  let action: (typeof ACTIVITY_ACTIONS)[keyof typeof ACTIVITY_ACTIONS] =
    ACTIVITY_ACTIONS.EMPLOYEE_UPDATED;
  if (input.status && input.status !== previousStatus) {
    if (input.status === EMPLOYEE_STATUS.ACTIVE) {
      action = ACTIVITY_ACTIONS.EMPLOYEE_ACTIVATED;
    } else if (input.status === EMPLOYEE_STATUS.INACTIVE) {
      action = ACTIVITY_ACTIONS.EMPLOYEE_DEACTIVATED;
    }
  }

  await recordActivity({
    actor,
    action,
    targetType: "User",
    targetId: toId(user),
    metadata: { changes: input },
  });

  await notifyAdmins(actor.id, {
    type: NOTIFICATION_TYPES.EMPLOYEE_UPDATED,
    title: "Employee record updated",
    message: `${user.fullName} (${user.employeeId}) was updated`,
    metadata: { employeeId: toId(user) },
  });

  return toPublicEmployee(user);
}

export async function setEmployeeActive(actor: Actor, id: string, isActive: boolean) {
  return updateEmployee(actor, id, {
    status: isActive ? EMPLOYEE_STATUS.ACTIVE : EMPLOYEE_STATUS.INACTIVE,
  });
}

// One-way: Probation -> Permanent only, no revert action. permanentSince
// is the reference point Annual Leave accrual counts eligible months from
// (see leave.service.ts's creditAnnualAccrual) — Probation employees don't
// accrue at all, so this is also the moment accrual starts for them.
export async function promoteToPermanent(actor: Actor, id: string) {
  const user = await UserModel.findById(id);
  if (!user) {
    throw new ApiError(404, "Employee not found");
  }
  if (user.employmentType === EMPLOYMENT_TYPE.PERMANENT) {
    throw new ApiError(409, "This employee is already Permanent");
  }

  user.employmentType = EMPLOYMENT_TYPE.PERMANENT;
  user.permanentSince = new Date();
  await user.save();
  await user.populate(POPULATE_FIELDS);

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.EMPLOYEE_UPDATED,
    targetType: "User",
    targetId: toId(user),
    metadata: { employmentType: EMPLOYMENT_TYPE.PERMANENT },
  });

  await notifyAdmins(actor.id, {
    type: NOTIFICATION_TYPES.EMPLOYEE_UPDATED,
    title: "Employee marked Permanent",
    message: `${user.fullName} (${user.employeeId}) was marked as a Permanent employee`,
    metadata: { employeeId: toId(user) },
  });

  return toPublicEmployee(user);
}

// Unconditional hard delete — removes the employee and cascades to every
// record that belongs to them (attendance, leave requests, leave balances,
// attendance corrections), so nothing is left pointing at a deleted user.
// This is irreversible and destroys history; there is no confirmation
// beyond the confirm dialog the caller already showed. Deactivating or
// marking someone Resigned/Terminated is the alternative when the history
// needs to be kept.
export async function deleteEmployee(actor: Actor, id: string): Promise<void> {
  const user = await UserModel.findById(id);
  if (!user) {
    throw new ApiError(404, "Employee not found");
  }

  if (actor.id === id) {
    throw new ApiError(403, "You cannot delete your own account");
  }
  if (user.role === ROLES.SUPER_ADMIN) {
    throw new ApiError(403, "A Super Admin account cannot be deleted");
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // Everything that belongs TO this employee goes with them.
      await AttendanceModel.deleteMany({ employee: id }).session(session);
      await LeaveRequestModel.deleteMany({ employee: id }).session(session);
      await LeaveBalanceModel.deleteMany({ employee: id }).session(session);
      await AttendanceCorrectionModel.deleteMany({ employee: id }).session(session);
      await NotificationModel.deleteMany({ user: id }).session(session);
      // Requests that belong to someone else but this employee reviewed —
      // not deleted (that history isn't theirs to lose), just detached so
      // the reference doesn't dangle.
      await LeaveRequestModel.updateMany(
        { reviewedBy: id },
        { $set: { reviewedBy: null } }
      ).session(session);
      await AttendanceCorrectionModel.updateMany(
        { reviewedBy: id },
        { $set: { reviewedBy: null } }
      ).session(session);
      await UserModel.findByIdAndDelete(id).session(session);
    });
  } finally {
    await session.endSession();
  }

  // S3 isn't part of the Mongo transaction above — this runs after it
  // commits, same best-effort spirit as deleteObject itself (a stray S3
  // object left behind is a minor cleanup issue, not a reason to fail an
  // otherwise-successful employee deletion).
  await purgeAllDocumentsForEmployee(id);

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.EMPLOYEE_DELETED,
    targetType: "User",
    targetId: id,
    metadata: { employeeId: user.employeeId, fullName: user.fullName },
  });

  await notifyAdmins(actor.id, {
    type: NOTIFICATION_TYPES.EMPLOYEE_DELETED,
    title: "Employee deleted",
    message: `${user.fullName} (${user.employeeId}) was permanently deleted`,
    metadata: { employeeId: user.employeeId },
  });
}

export async function getMyProfile(userId: string) {
  const user = await UserModel.findById(userId).populate(POPULATE_FIELDS);
  if (!user) {
    throw new ApiError(404, "Employee not found");
  }
  return toPublicEmployee(user);
}

interface UpdateProfileInput {
  phone?: string;
  dateOfBirth?: Date;
  address?: string;
  profilePhoto?: string;
  emergencyContact?: { name: string; phone: string };
}

export async function updateMyProfile(userId: string, input: UpdateProfileInput) {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new ApiError(404, "Employee not found");
  }

  if (input.phone !== undefined) user.phone = input.phone;
  if (input.dateOfBirth !== undefined) user.dateOfBirth = input.dateOfBirth;
  if (input.address !== undefined) user.address = input.address;
  if (input.profilePhoto !== undefined) user.profilePhoto = input.profilePhoto;
  if (input.emergencyContact !== undefined) {
    user.emergencyContact = input.emergencyContact;
  }

  await user.save();
  await user.populate(POPULATE_FIELDS);
  return toPublicEmployee(user);
}
