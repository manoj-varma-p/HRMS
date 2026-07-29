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
import { EMPLOYMENT_TYPE, EmploymentType } from "../../shared/constants/employmentType";
import { toId } from "../../shared/utils/toId";
import { getISTDateString, daysBetweenDateStrings } from "../../shared/utils/istDate";
import { resolveViewableEmployeeId } from "../../shared/utils/resolveViewableEmployeeId";
import { recordActivity } from "../activity-log/activity-log.service";
import { notifyAdmins, notifyUser } from "../notifications/notifications.service";
import { UserModel } from "../user/user.model";
import { ILeaveBalance, LeaveBalanceModel } from "./leave-balance.model";
import { ILeaveRequest, LeaveRequestModel } from "./leave-request.model";
import { LeaveAllocationModel, ALLOCATION_PERIOD, AllocationPeriod } from "./leave-allocation.model";
import { computeLeaveWorkingDays, countEligibleAccrualMonths } from "./leave.util";

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
  COMP_OFF: "Comp Off",
};

const APPLY_ALLOWED_STATUSES: string[] = [
  EMPLOYEE_STATUS.ACTIVE,
  EMPLOYEE_STATUS.NOTICE_PERIOD,
];

/**
 * Jan-Jun = H1, Jul-Dec = H2, based on the leave request's own start date.
 * Shared by both Sick and Casual Paid Leave, the two half-year-split types.
 */
function leaveHalf(dateStr: string): "H1" | "H2" {
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

// Shared by Sick and Casual Paid Leave — both are split into two half-year
// buckets, with H2's quota including whatever H1 left unused (when
// carry-forward is on). H1 is always fully closed out by the time H2
// starts, so this is never computed against an in-progress half.
function computeHalfYearBuckets(
  quotaPerHalf: number,
  extraH1: number,
  extraH2: number,
  usedH1: number,
  usedH2: number,
  pendingH1: number,
  pendingH2: number,
  carryForwardEnabled: boolean
) {
  const h1Total = quotaPerHalf;
  const h1Remaining = Math.max(0, h1Total - usedH1 - pendingH1);

  const carryOver = carryForwardEnabled ? Math.max(0, h1Total - usedH1) : 0;
  const h2Total = quotaPerHalf + carryOver;
  const h2Remaining = Math.max(0, h2Total - usedH2 - pendingH2);

  return {
    half1: { used: usedH1, pending: pendingH1, total: h1Total, remaining: h1Remaining },
    half2: { used: usedH2, pending: pendingH2, total: h2Total, remaining: h2Remaining },
  };
}

// Annual Leave is credited flat +accrualPerMonth for every fully-completed
// calendar month the employee has been Permanent — no "zero leave taken"
// condition like Sick/Casual's quotas have, and Probation employees don't
// accrue at all. Mutates `balance` in place (annualAccrued/
// annualAccruedThroughMonth only) when new months have become eligible
// since it was last credited; never saves — callers already save balance
// for their own reasons.
function creditAnnualAccrual(
  balance: ILeaveBalance,
  employmentType: EmploymentType,
  permanentSince: Date | null,
  year: number,
  accrualPerMonth: number
): void {
  if (employmentType !== EMPLOYMENT_TYPE.PERMANENT) return;

  const eligibleMonths = countEligibleAccrualMonths(permanentSince, year, getISTDateString());
  if (eligibleMonths <= balance.annualAccruedThroughMonth) return;

  const newMonths = eligibleMonths - balance.annualAccruedThroughMonth;
  balance.annualAccrued = Math.round((balance.annualAccrued + newMonths * accrualPerMonth) * 100) / 100;
  balance.annualAccruedThroughMonth = eligibleMonths;
}

export async function getLeaveBalance(employeeId: string, year: number) {
  const employee = await UserModel.findById(employeeId).select("employmentType permanentSince");
  if (!employee) throw new ApiError(404, "Employee not found");

  let balance = await LeaveBalanceModel.findOne({ employee: employeeId, year });
  if (!balance) {
    balance = new LeaveBalanceModel({ employee: employeeId, year });
  }

  const policy = getLeavePolicy();
  creditAnnualAccrual(
    balance,
    employee.employmentType,
    employee.permanentSince,
    year,
    policy.annualAccrualPerMonth
  );
  if (balance.isNew || balance.isModified()) {
    await balance.save();
  }

  const pendingRequests = await LeaveRequestModel.find({
    employee: employeeId,
    status: LEAVE_REQUEST_STATUS.PENDING,
    startDate: { $gte: `${year}-01-01`, $lte: `${queryYearEnd(year)}` },
  });

  let pendingSickH1 = 0, pendingSickH2 = 0;
  let pendingCasualH1 = 0, pendingCasualH2 = 0;
  let pendingAnnual = 0, pendingUnpaid = 0, pendingCompOff = 0;

  for (const req of pendingRequests) {
    const half = leaveHalf(req.startDate);
    if (req.leaveType === LEAVE_TYPES.SICK) {
      if (half === "H1") pendingSickH1 += req.days;
      else pendingSickH2 += req.days;
    } else if (req.leaveType === LEAVE_TYPES.CASUAL_PAID) {
      if (half === "H1") pendingCasualH1 += req.days;
      else pendingCasualH2 += req.days;
    } else if (req.leaveType === LEAVE_TYPES.ANNUAL) {
      pendingAnnual += req.days;
    } else if (req.leaveType === LEAVE_TYPES.UNPAID) {
      pendingUnpaid += req.days;
    } else if (req.leaveType === LEAVE_TYPES.COMP_OFF) {
      pendingCompOff += req.days;
    }
  }

  const annualAccruedTotal = Math.round(balance.annualAccrued * 100) / 100;

  return {
    year,
    sick: computeHalfYearBuckets(
      policy.sickQuotaPerHalf,
      balance.sickExtraH1 || 0,
      balance.sickExtraH2 || 0,
      balance.sickUsedH1,
      balance.sickUsedH2,
      pendingSickH1,
      pendingSickH2,
      policy.carryForwardEnabled
    ),
    casualPaid: computeHalfYearBuckets(
      policy.casualPaidQuotaPerHalf,
      balance.casualPaidExtraH1 || 0,
      balance.casualPaidExtraH2 || 0,
      balance.casualPaidUsedH1,
      balance.casualPaidUsedH2,
      pendingCasualH1,
      pendingCasualH2,
      policy.carryForwardEnabled
    ),
    annual: {
      used: balance.annualUsed,
      pending: pendingAnnual,
      accrued: annualAccruedTotal,
      remaining: Math.max(0, Math.round((annualAccruedTotal - balance.annualUsed - pendingAnnual) * 100) / 100),
    },
    unpaid: { used: balance.unpaidUsed, pending: pendingUnpaid, total: null, remaining: null },
    compOff: {
      granted: balance.compOffGranted || 0,
      used: balance.compOffUsed || 0,
      pending: pendingCompOff,
      remaining: Math.max(0, (balance.compOffGranted || 0) - (balance.compOffUsed || 0) - pendingCompOff),
    },
  };
}

function queryYearEnd(year: number): string {
  return `${year}-12-31`;
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

  // Rule: Paid leaves cannot exceed 2 working days. Requests > 2 days must be Unpaid Leave.
  if (days > 2 && input.leaveType !== LEAVE_TYPES.UNPAID) {
    throw new ApiError(
      400,
      "Leaves longer than 2 working days cannot be taken as paid leave. Please select Unpaid Leave."
    );
  }

  // Rule: Casual leave can only be taken once per calendar month.
  if (input.leaveType === LEAVE_TYPES.CASUAL_PAID) {
    const startMonthPrefix = input.startDate.slice(0, 7);
    const existingCasualInMonth = await LeaveRequestModel.findOne({
      employee: actor.id,
      leaveType: LEAVE_TYPES.CASUAL_PAID,
      status: { $in: [LEAVE_REQUEST_STATUS.PENDING, LEAVE_REQUEST_STATUS.APPROVED] },
      startDate: { $regex: `^${startMonthPrefix}` },
    });
    if (existingCasualInMonth) {
      throw new ApiError(
        400,
        "Casual leave can only be taken once per month. You have already applied for or taken casual leave this month."
      );
    }
  }

  if (input.leaveType !== LEAVE_TYPES.UNPAID) {
    const year = Number(input.startDate.slice(0, 4));
    const balance = await getLeaveBalance(actor.id, year);
    const half = leaveHalf(input.startDate) === "H1" ? "half1" : "half2";
    const relevant =
      input.leaveType === LEAVE_TYPES.SICK
        ? balance.sick[half]
        : input.leaveType === LEAVE_TYPES.CASUAL_PAID
          ? balance.casualPaid[half]
          : input.leaveType === LEAVE_TYPES.COMP_OFF
            ? balance.compOff
            : balance.annual;
    if (relevant.remaining !== null && days > relevant.remaining) {
      throw new ApiError(
        409,
        `Insufficient leave balance: ${relevant.remaining} day(s) available, ${days} requested`
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

      let field:
        | "sickUsedH1"
        | "sickUsedH2"
        | "casualPaidUsedH1"
        | "casualPaidUsedH2"
        | "annualUsed"
        | "unpaidUsed"
        | "compOffUsed";
      // null means "unlimited, no capacity check" (Unpaid Leave only).
      let quota: number | null = null;

      if (leave.leaveType === LEAVE_TYPES.SICK) {
        if (leaveHalf(leave.startDate) === "H1") {
          field = "sickUsedH1";
          quota = policy.sickQuotaPerHalf;
        } else {
          field = "sickUsedH2";
          const h1Remaining = policy.sickQuotaPerHalf - balance.sickUsedH1;
          quota =
            policy.sickQuotaPerHalf + (policy.carryForwardEnabled ? Math.max(0, h1Remaining) : 0);
        }
      } else if (leave.leaveType === LEAVE_TYPES.CASUAL_PAID) {
        if (leaveHalf(leave.startDate) === "H1") {
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
          .select("employmentType permanentSince")
          .session(session);
        if (employee) {
          creditAnnualAccrual(
            balance,
            employee.employmentType,
            employee.permanentSince,
            year,
            policy.annualAccrualPerMonth
          );
        }
        quota = balance.annualAccrued;
      } else if (leave.leaveType === LEAVE_TYPES.COMP_OFF) {
        field = "compOffUsed";
        quota = balance.compOffGranted;
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

export interface GrantExtraLeaveInput {
  employeeId: string;
  days: number;
  reason: string;
  leaveType?: LeaveType;
  period?: AllocationPeriod;
  year?: number;
}

export async function grantExtraLeave(actor: Actor, input: GrantExtraLeaveInput) {
  const employee = await UserModel.findById(input.employeeId);
  if (!employee) throw new ApiError(404, "Employee not found");

  const year = input.year ?? new Date().getFullYear();

  let balance = await LeaveBalanceModel.findOne({ employee: input.employeeId, year });
  if (!balance) {
    balance = new LeaveBalanceModel({ employee: input.employeeId, year });
  }

  const leaveType = input.leaveType ?? LEAVE_TYPES.COMP_OFF;
  const period = input.period ?? ALLOCATION_PERIOD.ANNUAL;

  if (leaveType === LEAVE_TYPES.COMP_OFF) {
    balance.compOffGranted = (balance.compOffGranted || 0) + input.days;
  } else if (leaveType === LEAVE_TYPES.SICK) {
    if (period === ALLOCATION_PERIOD.H1) balance.sickExtraH1 += input.days;
    else balance.sickExtraH2 += input.days;
  } else if (leaveType === LEAVE_TYPES.CASUAL_PAID) {
    if (period === ALLOCATION_PERIOD.H1) balance.casualPaidExtraH1 += input.days;
    else balance.casualPaidExtraH2 += input.days;
  } else if (leaveType === LEAVE_TYPES.ANNUAL) {
    balance.annualExtra += input.days;
  }

  await balance.save();

  const allocation = await LeaveAllocationModel.create({
    employee: input.employeeId,
    leaveType,
    period,
    year,
    days: input.days,
    reason: input.reason,
    grantedBy: actor.id,
  });

  await recordActivity({
    actor,
    action: "LEAVE_EXTRA_GRANTED",
    targetType: "LeaveAllocation",
    targetId: toId(allocation),
    metadata: {
      employeeId: input.employeeId,
      leaveType: input.leaveType,
      days: input.days,
      reason: input.reason,
    },
  });

  return allocation;
}

export async function listLeaveAllocations(query?: { employeeId?: string; year?: number }) {
  const filter: Record<string, unknown> = {};
  if (query?.employeeId) filter.employee = query.employeeId;
  if (query?.year) filter.year = query.year;

  const allocations = await LeaveAllocationModel.find(filter)
    .populate("employee", "employeeId fullName profilePhoto department designation")
    .populate("grantedBy", "fullName")
    .sort({ createdAt: -1 });

  return allocations.map((a) => {
    const emp = a.employee as unknown as { _id: unknown; employeeId: string; fullName: string; profilePhoto?: string };
    const admin = a.grantedBy as unknown as { fullName: string };
    return {
      id: toId(a),
      employee: {
        id: String(emp._id),
        employeeId: emp.employeeId,
        fullName: emp.fullName,
        profilePhoto: emp.profilePhoto ?? null,
      },
      leaveType: a.leaveType,
      period: a.period,
      year: a.year,
      days: a.days,
      reason: a.reason,
      grantedBy: admin?.fullName ?? "System Admin",
      createdAt: a.createdAt,
    };
  });
}

export { resolveViewableEmployeeId };
