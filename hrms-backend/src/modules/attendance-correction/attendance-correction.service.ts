import { ApiError } from "../../shared/errors/ApiError";
import { ACTIVITY_ACTIONS } from "../../shared/constants/activityActions";
import { NOTIFICATION_TYPES } from "../../shared/constants/notificationTypes";
import { toId } from "../../shared/utils/toId";
import { recordActivity } from "../activity-log/activity-log.service";
import { notifyUser } from "../notifications/notifications.service";
import { AttendanceModel } from "../attendance/attendance.model";
import { computeAttendanceStatus } from "../attendance/attendance.util";
import { UserModel } from "../user/user.model";
import {
  AttendanceCorrectionModel,
  CORRECTION_STATUS,
  CorrectionStatus,
  IAttendanceCorrection,
} from "./attendance-correction.model";

interface Actor {
  id: string;
  role: string;
  employeeId: string;
}

function toPublicCorrection(c: IAttendanceCorrection) {
  return {
    id: toId(c),
    employee: c.employee,
    date: c.date,
    requestedCheckIn: c.requestedCheckIn,
    requestedCheckOut: c.requestedCheckOut,
    reason: c.reason,
    status: c.status,
    reviewedBy: c.reviewedBy,
    reviewComment: c.reviewComment,
    originalCheckIn: c.originalCheckIn,
    originalCheckOut: c.originalCheckOut,
    createdAt: c.createdAt,
  };
}

interface RequestCorrectionInput {
  date: string;
  requestedCheckIn?: Date;
  requestedCheckOut?: Date;
  reason: string;
}

export async function requestCorrection(actor: Actor, input: RequestCorrectionInput) {
  const existingAttendance = await AttendanceModel.findOne({
    employee: actor.id,
    date: input.date,
  });

  const pendingDuplicate = await AttendanceCorrectionModel.findOne({
    employee: actor.id,
    date: input.date,
    status: CORRECTION_STATUS.PENDING,
  });
  if (pendingDuplicate) {
    throw new ApiError(409, "You already have a pending correction request for this date");
  }

  const correction = await AttendanceCorrectionModel.create({
    employee: actor.id,
    date: input.date,
    requestedCheckIn: input.requestedCheckIn ?? null,
    requestedCheckOut: input.requestedCheckOut ?? null,
    reason: input.reason,
    status: CORRECTION_STATUS.PENDING,
    originalCheckIn: existingAttendance?.checkIn ?? null,
    originalCheckOut: existingAttendance?.checkOut ?? null,
  });

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.ATTENDANCE_CORRECTION_REQUESTED,
    targetType: "AttendanceCorrection",
    targetId: toId(correction),
    metadata: { date: input.date, reason: input.reason },
  });

  return toPublicCorrection(correction);
}

interface ListQuery {
  page: number;
  limit: number;
  status?: CorrectionStatus;
}

export async function listMyCorrections(employeeId: string, query: ListQuery) {
  const filter: Record<string, unknown> = { employee: employeeId };
  if (query.status) filter.status = query.status;

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    AttendanceCorrectionModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit),
    AttendanceCorrectionModel.countDocuments(filter),
  ]);

  return {
    corrections: items.map(toPublicCorrection),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function adminListCorrections(query: ListQuery) {
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    AttendanceCorrectionModel.find(filter)
      .populate({ path: "employee", select: "employeeId fullName" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit),
    AttendanceCorrectionModel.countDocuments(filter),
  ]);

  return {
    corrections: items.map((c) => ({ ...toPublicCorrection(c), employee: c.employee })),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function approveCorrection(
  actor: Actor,
  correctionId: string,
  comment?: string
) {
  const correction = await AttendanceCorrectionModel.findById(correctionId);
  if (!correction) throw new ApiError(404, "Correction request not found");
  if (correction.status !== CORRECTION_STATUS.PENDING) {
    throw new ApiError(409, "This request has already been reviewed");
  }

  let attendance = await AttendanceModel.findOne({
    employee: correction.employee,
    date: correction.date,
  });

  const nextCheckIn = correction.requestedCheckIn ?? attendance?.checkIn ?? null;
  const nextCheckOut = correction.requestedCheckOut ?? attendance?.checkOut ?? null;

  if (!nextCheckIn) {
    throw new ApiError(
      400,
      "Cannot apply this correction without a check-in time on record"
    );
  }

  const employee = await UserModel.findById(correction.employee).select(
    "gracePeriodOverrideMinutes"
  );
  const { status, workedHours } = computeAttendanceStatus(
    nextCheckIn,
    nextCheckOut,
    employee?.gracePeriodOverrideMinutes ?? null
  );

  if (!attendance) {
    attendance = new AttendanceModel({
      employee: correction.employee,
      date: correction.date,
      status,
    });
  }
  attendance.checkIn = nextCheckIn;
  attendance.checkOut = nextCheckOut;
  attendance.status = status;
  attendance.workedHours = workedHours;
  await attendance.save();

  correction.status = CORRECTION_STATUS.APPROVED;
  correction.reviewedBy = actor.id as never;
  correction.reviewComment = comment ?? null;
  await correction.save();

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.ATTENDANCE_CORRECTION_APPROVED,
    targetType: "AttendanceCorrection",
    targetId: toId(correction),
    metadata: {
      date: correction.date,
      appliedCheckIn: nextCheckIn,
      appliedCheckOut: nextCheckOut,
    },
  });

  await notifyUser({
    user: String(correction.employee),
    type: NOTIFICATION_TYPES.ATTENDANCE_CORRECTION_APPROVED,
    title: "Attendance correction approved",
    message: `Your correction request for ${correction.date} was approved`,
    metadata: { correctionId: toId(correction) },
  });

  return toPublicCorrection(correction);
}

export async function rejectCorrection(
  actor: Actor,
  correctionId: string,
  comment?: string
) {
  const correction = await AttendanceCorrectionModel.findById(correctionId);
  if (!correction) throw new ApiError(404, "Correction request not found");
  if (correction.status !== CORRECTION_STATUS.PENDING) {
    throw new ApiError(409, "This request has already been reviewed");
  }

  correction.status = CORRECTION_STATUS.REJECTED;
  correction.reviewedBy = actor.id as never;
  correction.reviewComment = comment ?? null;
  await correction.save();

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.ATTENDANCE_CORRECTION_REJECTED,
    targetType: "AttendanceCorrection",
    targetId: toId(correction),
    metadata: { date: correction.date, comment },
  });

  await notifyUser({
    user: String(correction.employee),
    type: NOTIFICATION_TYPES.ATTENDANCE_CORRECTION_REJECTED,
    title: "Attendance correction rejected",
    message: `Your correction request for ${correction.date} was rejected`,
    metadata: { correctionId: toId(correction) },
  });

  return toPublicCorrection(correction);
}
