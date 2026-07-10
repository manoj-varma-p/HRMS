import mongoose from "mongoose";
import { ApiError } from "../../shared/errors/ApiError";
import { env } from "../../shared/config/env";
import { ACTIVITY_ACTIONS } from "../../shared/constants/activityActions";
import { NOTIFICATION_TYPES } from "../../shared/constants/notificationTypes";
import { getLeavePolicy } from "../configuration/configuration.cache";
import {
  LEAVE_REQUEST_STATUS,
  LEAVE_TYPES,
  LeaveRequestStatus,
  LeaveType,
} from "../../shared/constants/leaveTypes";
import { EMPLOYEE_STATUS } from "../../shared/constants/employeeStatus";
import { toId } from "../../shared/utils/toId";
import { getISTDateString, daysBetweenDateStrings } from "../../shared/utils/istDate";
import { resolveViewableEmployeeId } from "../../shared/utils/resolveViewableEmployeeId";
import { recordActivity } from "../activity-log/activity-log.service";
import { notifyAdmins, notifyUser } from "../notifications/notifications.service";
import { UserModel } from "../user/user.model";
import { LeaveBalanceModel } from "./leave-balance.model";
import { ILeaveRequest, LeaveRequestModel } from "./leave-request.model";
import { computeLeaveWorkingDays, getAnnualLeaveAccrued } from "./leave.util";

interface Actor {
  id: string;
  role: string;
  employeeId: string;
}

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  SICK: "Sick",
  CASUAL_PAID: "Casual",
  ANNUAL: "Annual",
  UNPAID: "Unpaid",
};

const APPLY_ALLOWED_STATUSES: string[] = [
  EMPLOYEE_STATUS.ACTIVE,
  EMPLOYEE_STATUS.NOTICE_PERIOD,
];

/** Jan-Jun = H1, Jul-Dec = H2, based on the leave request's own start date. */
function casualLeaveHalf(dateStr: string): "H1" | "H2" {
  return Number(dateStr.slice(5, 7)) <= 6 ? "H1" : "H2";
}

function toPublicLeave(leave: ILeaveRequest) {
  return {
    id: toId(leave),
    employee: leave.employee,
    leaveType: leave.leaveType,
    startDate: leave.startDate,
    endDate: leave.endDate,
    days: leave.days,
    reason: leave.reason,
    status: leave.status,
    reviewedBy: leave.reviewedBy,
    reviewComment: leave.reviewComment,
    createdAt: leave.createdAt,
  };
}

// Used by the attendance engine (Phase 4) to mark days On Leave. Lives here
// rather than being computed by the caller so leave's definition of
// "approved leave covers this date" has exactly one implementation.
export async function getApprovedLeaveDateSet(
  employeeId: string,
  start: string,
  end: string
): Promise<Set<string>> {
  const overlapping = await LeaveRequestModel.find({
    employee: employeeId,
    status: LEAVE_REQUEST_STATUS.APPROVED,
    startDate: { $lte: end },
    endDate: { $gte: start },
  }).select("startDate endDate");

  const dates = new Set<string>();
  for (const leave of overlapping) {
    const rangeStart = leave.startDate > start ? leave.startDate : start;
    const rangeEnd = leave.endDate < end ? leave.endDate : end;
    const cursor = new Date(`${rangeStart}T00:00:00+05:30`);
    const endCursor = new Date(`${rangeEnd}T00:00:00+05:30`);
    while (cursor.getTime() <= endCursor.getTime()) {
      dates.add(getISTDateString(cursor));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }
  return dates;
}

export async function getLeaveBalance(employeeId: string, year: number) {
  const employee = await UserModel.findById(employeeId).select("joiningDate");
  if (!employee) throw new ApiError(404, "Employee not found");

  const balance = await LeaveBalanceModel.findOne({ employee: employeeId, year });
  const sickUsed = balance?.sickUsed ?? 0;
  const casualPaidUsedH1 = balance?.casualPaidUsedH1 ?? 0;
  const casualPaidUsedH2 = balance?.casualPaidUsedH2 ?? 0;
  const annualUsed = balance?.annualUsed ?? 0;
  const unpaidUsed = balance?.unpaidUsed ?? 0;

  const policy = getLeavePolicy();
  const sickQuota = policy.sickQuota;

  // H2's quota includes whatever H1 left unused (if carry-forward is on) —
  // H1 is always fully closed out by the time H2 starts, so this is never
  // computed against an in-progress half.
  const h1Total = policy.casualPaidQuotaPerHalf;
  const h1Remaining = h1Total - casualPaidUsedH1;
  const h2Total = policy.casualPaidQuotaPerHalf + (policy.carryForwardEnabled ? Math.max(0, h1Remaining) : 0);
  const h2Remaining = h2Total - casualPaidUsedH2;

  const annualAccrued = await getAnnualLeaveAccrued(
    employeeId,
    employee.joiningDate,
    year,
    getISTDateString(),
    policy.annualAccrualPerMonth
  );

  return {
    year,
    sick: { used: sickUsed, total: sickQuota, remaining: sickQuota - sickUsed },
    casualPaid: {
      half1: { used: casualPaidUsedH1, total: h1Total, remaining: h1Remaining },
      half2: { used: casualPaidUsedH2, total: h2Total, remaining: h2Remaining },
    },
    annual: {
      used: annualUsed,
      accrued: annualAccrued,
      remaining: Math.round((annualAccrued - annualUsed) * 100) / 100,
    },
    unpaid: { used: unpaidUsed, total: null, remaining: null },
  };
}

interface ApplyLeaveInput {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}

export async function applyLeave(actor: Actor, input: ApplyLeaveInput) {
  if (input.startDate > input.endDate) {
    throw new ApiError(400, "Start date must be before or equal to the end date");
  }

  const employee = await UserModel.findById(actor.id);
  if (!employee) throw new ApiError(404, "Employee not found");
  if (!APPLY_ALLOWED_STATUSES.includes(employee.status)) {
    throw new ApiError(403, "Your account is not eligible to apply for leave");
  }

  const joiningDateStr = getISTDateString(employee.joiningDate);
  if (input.startDate < joiningDateStr) {
    throw new ApiError(400, "Cannot apply for leave before your joining date");
  }

  const overlap = await LeaveRequestModel.findOne({
    employee: actor.id,
    status: { $in: [LEAVE_REQUEST_STATUS.PENDING, LEAVE_REQUEST_STATUS.APPROVED] },
    startDate: { $lte: input.endDate },
    endDate: { $gte: input.startDate },
  });
  if (overlap) {
    throw new ApiError(
      409,
      "You already have a pending or approved leave request that overlaps these dates"
    );
  }

  const policy = getLeavePolicy();

  if (input.leaveType === LEAVE_TYPES.UNPAID && !policy.unpaidAllowed) {
    throw new ApiError(403, "Unpaid leave is not permitted under the current leave policy");
  }

  if (input.leaveType === LEAVE_TYPES.CASUAL_PAID || input.leaveType === LEAVE_TYPES.ANNUAL) {
    const noticeDays =
      input.leaveType === LEAVE_TYPES.CASUAL_PAID
        ? policy.casualPaidNoticeDays
        : policy.annualNoticeDays;
    const notice = daysBetweenDateStrings(getISTDateString(), input.startDate);
    if (notice < noticeDays) {
      const label = input.leaveType === LEAVE_TYPES.CASUAL_PAID ? "Casual" : "Annual";
      throw new ApiError(
        422,
        `${label} leave requires at least ${noticeDays} day(s) advance notice`
      );
    }
  }

  const days = await computeLeaveWorkingDays(input.startDate, input.endDate);
  if (days <= 0) {
    throw new ApiError(
      400,
      "The selected range doesn't include any working days (weekends/holidays only)"
    );
  }
  if (days < policy.minDurationDays) {
    throw new ApiError(400, `Leave must be at least ${policy.minDurationDays} working day(s)`);
  }
  if (days > policy.maxDurationDays) {
    throw new ApiError(400, `Leave cannot exceed ${policy.maxDurationDays} working day(s)`);
  }

  if (input.leaveType !== LEAVE_TYPES.UNPAID) {
    const year = Number(input.startDate.slice(0, 4));
    const balance = await getLeaveBalance(actor.id, year);
    const relevant =
      input.leaveType === LEAVE_TYPES.SICK
        ? balance.sick
        : input.leaveType === LEAVE_TYPES.CASUAL_PAID
          ? balance.casualPaid[casualLeaveHalf(input.startDate) === "H1" ? "half1" : "half2"]
          : balance.annual;
    if (relevant.remaining !== null && days > relevant.remaining) {
      throw new ApiError(
        409,
        `Insufficient leave balance: ${relevant.remaining} day(s) remaining, ${days} requested`
      );
    }
  }

  const leave = await LeaveRequestModel.create({
    employee: actor.id,
    leaveType: input.leaveType,
    startDate: input.startDate,
    endDate: input.endDate,
    days,
    reason: input.reason,
    status: LEAVE_REQUEST_STATUS.PENDING,
  });

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.LEAVE_APPLIED,
    targetType: "LeaveRequest",
    targetId: toId(leave),
    metadata: { leaveType: input.leaveType, startDate: input.startDate, endDate: input.endDate, days },
  });

  await notifyAdmins(actor.id, {
    type: NOTIFICATION_TYPES.LEAVE_APPLIED,
    title: "New leave request",
    message: `${employee.fullName} (${employee.employeeId}) applied for ${LEAVE_TYPE_LABELS[input.leaveType]} leave`,
    metadata: { leaveId: toId(leave) },
    email: {
      template: "leave-applied",
      data: {
        employeeName: employee.fullName,
        employeeIdLabel: employee.employeeId,
        leaveType: LEAVE_TYPE_LABELS[input.leaveType],
        startDate: input.startDate,
        endDate: input.endDate,
        days,
        reason: input.reason,
        reviewUrl: `${env.clientOrigin}/leave/admin?requestId=${toId(leave)}`,
      },
    },
  });

  return toPublicLeave(leave);
}

interface ListQuery {
  page: number;
  limit: number;
  status?: LeaveRequestStatus;
  leaveType?: LeaveType;
  year?: number;
}

export async function listMyLeaves(employeeId: string, query: ListQuery) {
  const filter: Record<string, unknown> = { employee: employeeId };
  if (query.status) filter.status = query.status;
  if (query.leaveType) filter.leaveType = query.leaveType;
  if (query.year) {
    filter.startDate = { $gte: `${query.year}-01-01`, $lte: `${query.year}-12-31` };
  }

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    LeaveRequestModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
    LeaveRequestModel.countDocuments(filter),
  ]);

  return {
    leaves: items.map(toPublicLeave),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

interface AdminListQuery extends ListQuery {
  employeeId?: string;
  department?: string;
  designation?: string;
}

export async function adminListLeaves(query: AdminListQuery) {
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.leaveType) filter.leaveType = query.leaveType;
  if (query.year) {
    filter.startDate = { $gte: `${query.year}-01-01`, $lte: `${query.year}-12-31` };
  }

  if (query.employeeId) {
    filter.employee = query.employeeId;
  } else if (query.department || query.designation) {
    const userFilter: Record<string, unknown> = {};
    if (query.department) userFilter.department = query.department;
    if (query.designation) userFilter.designation = query.designation;
    const matchingUsers = await UserModel.find(userFilter).select("_id");
    filter.employee = { $in: matchingUsers.map((u) => u._id) };
  }

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    LeaveRequestModel.find(filter)
      .populate({
        path: "employee",
        select: "employeeId fullName department designation",
        populate: [
          { path: "department", select: "name" },
          { path: "designation", select: "name" },
        ],
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit),
    LeaveRequestModel.countDocuments(filter),
  ]);

  return {
    leaves: items.map((leave) => ({ ...toPublicLeave(leave), employee: leave.employee })),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function cancelLeave(actor: Actor, leaveId: string) {
  const leave = await LeaveRequestModel.findById(leaveId);
  if (!leave) throw new ApiError(404, "Leave request not found");
  if (String(leave.employee) !== actor.id) {
    throw new ApiError(403, "You can only cancel your own leave requests");
  }
  if (leave.status !== LEAVE_REQUEST_STATUS.PENDING) {
    throw new ApiError(409, "Only pending leave requests can be cancelled");
  }

  leave.status = LEAVE_REQUEST_STATUS.CANCELLED;
  await leave.save();

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.LEAVE_CANCELLED,
    targetType: "LeaveRequest",
    targetId: toId(leave),
    metadata: { startDate: leave.startDate, endDate: leave.endDate },
  });

  return toPublicLeave(leave);
}

export async function approveLeave(actor: Actor, leaveId: string, comment?: string) {
  const session = await mongoose.startSession();
  let result: ILeaveRequest | null = null;

  try {
    await session.withTransaction(async () => {
      const leave = await LeaveRequestModel.findById(leaveId).session(session);
      if (!leave) throw new ApiError(404, "Leave request not found");
      if (leave.status !== LEAVE_REQUEST_STATUS.PENDING) {
        throw new ApiError(409, "This request has already been reviewed");
      }

      const year = Number(leave.startDate.slice(0, 4));
      const policy = getLeavePolicy();

      let balance = await LeaveBalanceModel.findOne({
        employee: leave.employee,
        year,
      }).session(session);
      if (!balance) {
        balance = new LeaveBalanceModel({ employee: leave.employee, year });
      }

      let field: "sickUsed" | "casualPaidUsedH1" | "casualPaidUsedH2" | "annualUsed" | "unpaidUsed";
      // null means "unlimited, no capacity check" (Unpaid Leave only).
      let quota: number | null = null;

      if (leave.leaveType === LEAVE_TYPES.SICK) {
        field = "sickUsed";
        quota = policy.sickQuota;
      } else if (leave.leaveType === LEAVE_TYPES.CASUAL_PAID) {
        if (casualLeaveHalf(leave.startDate) === "H1") {
          field = "casualPaidUsedH1";
          quota = policy.casualPaidQuotaPerHalf;
        } else {
          field = "casualPaidUsedH2";
          const h1Remaining = policy.casualPaidQuotaPerHalf - balance.casualPaidUsedH1;
          quota =
            policy.casualPaidQuotaPerHalf +
            (policy.carryForwardEnabled ? Math.max(0, h1Remaining) : 0);
        }
      } else if (leave.leaveType === LEAVE_TYPES.ANNUAL) {
        field = "annualUsed";
        const employee = await UserModel.findById(leave.employee)
          .select("joiningDate")
          .session(session);
        quota = employee
          ? await getAnnualLeaveAccrued(
              String(leave.employee),
              employee.joiningDate,
              year,
              getISTDateString(),
              policy.annualAccrualPerMonth
            )
          : 0;
      } else {
        field = "unpaidUsed";
      }

      if (quota !== null && balance[field] + leave.days > quota) {
        throw new ApiError(409, "Insufficient leave balance remaining to approve this request");
      }

      balance[field] += leave.days;
      await balance.save({ session });

      leave.status = LEAVE_REQUEST_STATUS.APPROVED;
      leave.reviewedBy = actor.id as never;
      leave.reviewComment = comment ?? null;
      await leave.save({ session });

      result = leave;
    });
  } finally {
    await session.endSession();
  }

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.LEAVE_APPROVED,
    targetType: "LeaveRequest",
    targetId: leaveId,
    metadata: { comment },
  });

  const approvedEmployee = await UserModel.findById(result!.employee).select("fullName");

  await notifyUser({
    user: String(result!.employee),
    type: NOTIFICATION_TYPES.LEAVE_APPROVED,
    title: "Leave request approved",
    message: `Your ${result!.leaveType} leave from ${result!.startDate} to ${result!.endDate} was approved`,
    metadata: { leaveId },
    email: {
      template: "leave-approved",
      data: {
        employeeName: approvedEmployee?.fullName ?? "there",
        leaveType: LEAVE_TYPE_LABELS[result!.leaveType],
        startDate: result!.startDate,
        endDate: result!.endDate,
        days: result!.days,
        comment: comment ?? null,
      },
    },
  });

  return toPublicLeave(result!);
}

export async function rejectLeave(actor: Actor, leaveId: string, comment?: string) {
  const leave = await LeaveRequestModel.findById(leaveId);
  if (!leave) throw new ApiError(404, "Leave request not found");
  if (leave.status !== LEAVE_REQUEST_STATUS.PENDING) {
    throw new ApiError(409, "This request has already been reviewed");
  }

  leave.status = LEAVE_REQUEST_STATUS.REJECTED;
  leave.reviewedBy = actor.id as never;
  leave.reviewComment = comment ?? null;
  await leave.save();

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.LEAVE_REJECTED,
    targetType: "LeaveRequest",
    targetId: toId(leave),
    metadata: { comment },
  });

  const rejectedEmployee = await UserModel.findById(leave.employee).select("fullName");

  await notifyUser({
    user: String(leave.employee),
    type: NOTIFICATION_TYPES.LEAVE_REJECTED,
    title: "Leave request rejected",
    message: `Your ${leave.leaveType} leave from ${leave.startDate} to ${leave.endDate} was rejected`,
    metadata: { leaveId: toId(leave) },
    email: {
      template: "leave-rejected",
      data: {
        employeeName: rejectedEmployee?.fullName ?? "there",
        leaveType: LEAVE_TYPE_LABELS[leave.leaveType],
        startDate: leave.startDate,
        endDate: leave.endDate,
        days: leave.days,
        comment: comment ?? null,
      },
    },
  });

  return toPublicLeave(leave);
}

export { resolveViewableEmployeeId };
