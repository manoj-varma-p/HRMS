import { PipelineStage, Types } from "mongoose";
import { ATTENDANCE_STATUS, AttendanceStatus } from "../../shared/constants/attendanceStatus";
import {
  LEAVE_REQUEST_STATUS,
  LeaveRequestStatus,
  LeaveType,
} from "../../shared/constants/leaveTypes";
import { EMPLOYEE_STATUS } from "../../shared/constants/employeeStatus";
import { ACTIVITY_ACTIONS } from "../../shared/constants/activityActions";
import { NOTIFICATION_TYPES } from "../../shared/constants/notificationTypes";
import { enumerateISTDateStrings, getISTDateString } from "../../shared/utils/istDate";
import { exporters } from "../../shared/utils/csv";
import { toId } from "../../shared/utils/toId";
import { escapeRegex } from "../../shared/utils/regex";
import { NameRef } from "../../shared/types/populated";
import { recordActivity } from "../activity-log/activity-log.service";
import { notifyUser } from "../notifications/notifications.service";
import { isConfiguredWeekend } from "../configuration/configuration.cache";
import { AttendanceModel } from "../attendance/attendance.model";
import { getMonthSummary } from "../attendance/attendance.service";
import { LeaveRequestModel } from "../leave/leave-request.model";
import { HolidayModel } from "../holiday/holiday.model";
import { UserModel } from "../user/user.model";
import { DepartmentModel } from "../department/department.model";
import { listEmployees } from "../employee/employee.service";

interface Actor {
  id: string;
  role: string;
  employeeId: string;
}

function paginate(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

function currentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = getISTDateString(now);
  return { start, end };
}

function resolveRange(startDate?: string, endDate?: string): { start: string; end: string } {
  if (!startDate && !endDate) return currentMonthRange();
  return { start: startDate ?? "0000-01-01", end: endDate ?? "9999-12-31" };
}

/* ------------------------------------------------------------------ */
/* Attendance Report                                                   */
/* ------------------------------------------------------------------ */

export interface AttendanceReportFilters {
  startDate?: string;
  endDate?: string;
  department?: string;
  designation?: string;
  employeeId?: string;
  status?: AttendanceStatus;
  search?: string;
}

export interface AttendanceReportQuery extends AttendanceReportFilters {
  page: number;
  limit: number;
  sortBy: "date" | "employeeName" | "status" | "workedHours";
  sortOrder: "asc" | "desc";
}

const ATTENDANCE_SORT_FIELD: Record<AttendanceReportQuery["sortBy"], string> = {
  date: "date",
  employeeName: "employee.fullName",
  status: "displayStatus",
  workedHours: "workedHours",
};

function buildAttendancePipeline(
  filters: AttendanceReportFilters,
  todayStr: string
): Record<string, unknown>[] {
  const { start, end } = resolveRange(filters.startDate, filters.endDate);

  const pipeline: Record<string, unknown>[] = [
    { $match: { date: { $gte: start, $lte: end } } },
    { $lookup: { from: "users", localField: "employee", foreignField: "_id", as: "employee" } },
    { $unwind: "$employee" },
  ];

  const employeeMatch: Record<string, unknown> = {};
  if (filters.employeeId) employeeMatch["employee._id"] = new Types.ObjectId(filters.employeeId);
  if (filters.department) employeeMatch["employee.department"] = new Types.ObjectId(filters.department);
  if (filters.designation) employeeMatch["employee.designation"] = new Types.ObjectId(filters.designation);
  if (filters.search) {
    const regex = new RegExp(escapeRegex(filters.search.trim()), "i");
    employeeMatch.$or = [
      { "employee.fullName": regex },
      { "employee.employeeId": regex },
      { "employee.email": regex },
    ];
  }
  if (Object.keys(employeeMatch).length > 0) {
    pipeline.push({ $match: employeeMatch });
  }

  // Mirrors attendance.util's deriveDisplayStatus rule exactly. Kept in
  // sync manually since Mongo aggregation can't call that function
  // in-pipeline — any change to the read-time Missed Checkout rule must
  // be mirrored here.
  pipeline.push({
    $addFields: {
      displayStatus: {
        $cond: [
          {
            $and: [
              { $ne: ["$checkIn", null] },
              { $eq: ["$checkOut", null] },
              { $lt: ["$date", todayStr] },
            ],
          },
          ATTENDANCE_STATUS.MISSED_CHECKOUT,
          "$status",
        ],
      },
    },
  });

  if (filters.status) {
    pipeline.push({ $match: { displayStatus: filters.status } });
  }

  return pipeline;
}

const ATTENDANCE_ROW_PROJECTION = {
  $project: {
    _id: 0,
    id: "$_id",
    employeeId: "$employee.employeeId",
    fullName: "$employee.fullName",
    department: "$department.name",
    designation: "$designation.name",
    date: 1,
    checkIn: 1,
    checkOut: 1,
    workedHours: 1,
    status: "$displayStatus",
  },
};

function attendanceDeptDesigLookups(): Record<string, unknown>[] {
  return [
    { $lookup: { from: "departments", localField: "employee.department", foreignField: "_id", as: "department" } },
    { $unwind: { path: "$department", preserveNullAndEmptyArrays: true } },
    { $lookup: { from: "designations", localField: "employee.designation", foreignField: "_id", as: "designation" } },
    { $unwind: { path: "$designation", preserveNullAndEmptyArrays: true } },
  ];
}

export async function getAttendanceReport(query: AttendanceReportQuery) {
  const todayStr = getISTDateString(new Date());
  const base = buildAttendancePipeline(query, todayStr);
  const skip = (query.page - 1) * query.limit;
  const sortField = ATTENDANCE_SORT_FIELD[query.sortBy];
  const sortDir = query.sortOrder === "asc" ? 1 : -1;

  // Department/designation lookups run only on the already-paginated
  // subset (inside the $facet "data" branch), not on the full filtered
  // set — the expensive joins never touch rows that won't be returned.
  const [result] = await AttendanceModel.aggregate([
    ...base,
    {
      $facet: {
        data: [
          { $sort: { [sortField]: sortDir, _id: 1 } },
          { $skip: skip },
          { $limit: query.limit },
          ...attendanceDeptDesigLookups(),
          ATTENDANCE_ROW_PROJECTION,
        ],
        totalCount: [{ $count: "count" }],
      },
    },
  ] as unknown as PipelineStage[]);

  const rows = result?.data ?? [];
  const total = result?.totalCount?.[0]?.count ?? 0;

  return { rows, pagination: paginate(query.page, query.limit, total) };
}

export async function exportAttendanceReportCsv(
  actor: Actor,
  filters: AttendanceReportFilters
): Promise<string> {
  const todayStr = getISTDateString(new Date());
  const base = buildAttendancePipeline(filters, todayStr);

  const records = await AttendanceModel.aggregate([
    ...base,
    { $sort: { date: -1 } },
    ...attendanceDeptDesigLookups(),
    ATTENDANCE_ROW_PROJECTION,
  ] as unknown as PipelineStage[]);

  const header = [
    "Employee ID",
    "Full Name",
    "Department",
    "Designation",
    "Date",
    "Check In",
    "Check Out",
    "Worked Hours",
    "Status",
  ];

  const rows = records.map((r) => [
    r.employeeId,
    r.fullName,
    r.department ?? "",
    r.designation ?? "",
    r.date,
    r.checkIn ? new Date(r.checkIn).toISOString() : "",
    r.checkOut ? new Date(r.checkOut).toISOString() : "",
    r.workedHours?.toString() ?? "",
    r.status ?? "",
  ]);

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.REPORT_EXPORTED,
    targetType: "Report",
    targetId: actor.id,
    metadata: { reportType: "attendance", rowCount: rows.length },
  });

  await notifyUser({
    user: actor.id,
    type: NOTIFICATION_TYPES.SYSTEM,
    title: "Report export ready",
    message: `Your Attendance Report export (${rows.length} row${rows.length === 1 ? "" : "s"}) completed`,
    metadata: { reportType: "attendance" },
  });

  return exporters.csv(header, rows).content;
}

/* ------------------------------------------------------------------ */
/* Leave Report                                                        */
/* ------------------------------------------------------------------ */

export interface LeaveReportFilters {
  startDate?: string;
  endDate?: string;
  department?: string;
  designation?: string;
  employeeId?: string;
  leaveType?: LeaveType;
  status?: LeaveRequestStatus;
  search?: string;
}

export interface LeaveReportQuery extends LeaveReportFilters {
  page: number;
  limit: number;
  sortBy: "startDate" | "employeeName" | "leaveType" | "status" | "days" | "createdAt";
  sortOrder: "asc" | "desc";
}

const LEAVE_SORT_FIELD: Record<LeaveReportQuery["sortBy"], string> = {
  startDate: "startDate",
  employeeName: "employee.fullName",
  leaveType: "leaveType",
  status: "status",
  days: "days",
  createdAt: "createdAt",
};

function buildLeavePipeline(filters: LeaveReportFilters): Record<string, unknown>[] {
  const initialMatch: Record<string, unknown> = {};
  if (filters.endDate) initialMatch.startDate = { $lte: filters.endDate };
  if (filters.startDate) initialMatch.endDate = { $gte: filters.startDate };
  if (filters.leaveType) initialMatch.leaveType = filters.leaveType;
  if (filters.status) initialMatch.status = filters.status;

  const pipeline: Record<string, unknown>[] = [];
  if (Object.keys(initialMatch).length > 0) pipeline.push({ $match: initialMatch });

  pipeline.push(
    { $lookup: { from: "users", localField: "employee", foreignField: "_id", as: "employee" } },
    { $unwind: "$employee" }
  );

  const employeeMatch: Record<string, unknown> = {};
  if (filters.employeeId) employeeMatch["employee._id"] = new Types.ObjectId(filters.employeeId);
  if (filters.department) employeeMatch["employee.department"] = new Types.ObjectId(filters.department);
  if (filters.designation) employeeMatch["employee.designation"] = new Types.ObjectId(filters.designation);
  if (filters.search) {
    const regex = new RegExp(escapeRegex(filters.search.trim()), "i");
    employeeMatch.$or = [
      { "employee.fullName": regex },
      { "employee.employeeId": regex },
      { "employee.email": regex },
    ];
  }
  if (Object.keys(employeeMatch).length > 0) pipeline.push({ $match: employeeMatch });

  return pipeline;
}

const LEAVE_ROW_PROJECTION = {
  $project: {
    _id: 0,
    id: "$_id",
    employeeId: "$employee.employeeId",
    fullName: "$employee.fullName",
    department: "$department.name",
    designation: "$designation.name",
    leaveType: 1,
    startDate: 1,
    endDate: 1,
    days: 1,
    reason: 1,
    status: 1,
    reviewedBy: "$reviewer.fullName",
    createdAt: 1,
  },
};

function leaveDeptDesigLookups(): Record<string, unknown>[] {
  return [
    { $lookup: { from: "departments", localField: "employee.department", foreignField: "_id", as: "department" } },
    { $unwind: { path: "$department", preserveNullAndEmptyArrays: true } },
    { $lookup: { from: "designations", localField: "employee.designation", foreignField: "_id", as: "designation" } },
    { $unwind: { path: "$designation", preserveNullAndEmptyArrays: true } },
    { $lookup: { from: "users", localField: "reviewedBy", foreignField: "_id", as: "reviewer" } },
    { $unwind: { path: "$reviewer", preserveNullAndEmptyArrays: true } },
  ];
}

export async function getLeaveReport(query: LeaveReportQuery) {
  const base = buildLeavePipeline(query);
  const skip = (query.page - 1) * query.limit;
  const sortField = LEAVE_SORT_FIELD[query.sortBy];
  const sortDir = query.sortOrder === "asc" ? 1 : -1;

  const [result] = await LeaveRequestModel.aggregate([
    ...base,
    {
      $facet: {
        data: [
          { $sort: { [sortField]: sortDir, _id: 1 } },
          { $skip: skip },
          { $limit: query.limit },
          ...leaveDeptDesigLookups(),
          LEAVE_ROW_PROJECTION,
        ],
        totalCount: [{ $count: "count" }],
      },
    },
  ] as unknown as PipelineStage[]);

  const rows = result?.data ?? [];
  const total = result?.totalCount?.[0]?.count ?? 0;

  return { rows, pagination: paginate(query.page, query.limit, total) };
}

export async function exportLeaveReportCsv(
  actor: Actor,
  filters: LeaveReportFilters
): Promise<string> {
  const base = buildLeavePipeline(filters);

  const records = await LeaveRequestModel.aggregate([
    ...base,
    { $sort: { startDate: -1 } },
    ...leaveDeptDesigLookups(),
    LEAVE_ROW_PROJECTION,
  ] as unknown as PipelineStage[]);

  const header = [
    "Employee ID",
    "Full Name",
    "Department",
    "Designation",
    "Leave Type",
    "Start Date",
    "End Date",
    "Days",
    "Status",
    "Reason",
    "Reviewed By",
    "Applied On",
  ];

  const rows = records.map((r) => [
    r.employeeId,
    r.fullName,
    r.department ?? "",
    r.designation ?? "",
    r.leaveType,
    r.startDate,
    r.endDate,
    r.days?.toString() ?? "",
    r.status,
    r.reason ?? "",
    r.reviewedBy ?? "",
    r.createdAt ? new Date(r.createdAt).toISOString() : "",
  ]);

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.REPORT_EXPORTED,
    targetType: "Report",
    targetId: actor.id,
    metadata: { reportType: "leave", rowCount: rows.length },
  });

  await notifyUser({
    user: actor.id,
    type: NOTIFICATION_TYPES.SYSTEM,
    title: "Report export ready",
    message: `Your Leave Report export (${rows.length} row${rows.length === 1 ? "" : "s"}) completed`,
    metadata: { reportType: "leave" },
  });

  return exporters.csv(header, rows).content;
}

/* ------------------------------------------------------------------ */
/* Employee Report                                                     */
/* ------------------------------------------------------------------ */

export interface EmployeeReportFilters {
  department?: string;
  designation?: string;
  role?: string;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface EmployeeReportQuery extends EmployeeReportFilters {
  page: number;
  limit: number;
  sortBy: "fullName" | "employeeId" | "joiningDate" | "createdAt";
  sortOrder: "asc" | "desc";
}

async function getEmployeeStats(employeeIds: Types.ObjectId[], start: string, end: string) {
  const [presentAgg, leaveAgg] = await Promise.all([
    AttendanceModel.aggregate([
      { $match: { employee: { $in: employeeIds }, date: { $gte: start, $lte: end }, checkIn: { $ne: null } } },
      { $group: { _id: "$employee", presentDays: { $sum: 1 } } },
    ]),
    LeaveRequestModel.aggregate([
      {
        $match: {
          employee: { $in: employeeIds },
          status: LEAVE_REQUEST_STATUS.APPROVED,
          startDate: { $lte: end },
          endDate: { $gte: start },
        },
      },
      { $group: { _id: "$employee", leaveDays: { $sum: "$days" } } },
    ]),
  ]);

  return {
    presentMap: new Map<string, number>(presentAgg.map((r) => [String(r._id), r.presentDays as number])),
    leaveMap: new Map<string, number>(leaveAgg.map((r) => [String(r._id), r.leaveDays as number])),
  };
}

export async function getEmployeeReport(query: EmployeeReportQuery) {
  const { start, end } = resolveRange(query.startDate, query.endDate);

  const { employees, pagination } = await listEmployees({
    page: query.page,
    limit: query.limit,
    search: query.search,
    department: query.department,
    designation: query.designation,
    role: query.role,
    status: query.status,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });

  // Two grouped aggregations for the whole page, not one query per
  // employee — bounded to <= page size (max 100), never N+1.
  const employeeIds = employees.map((e) => new Types.ObjectId(e.id));
  const { presentMap, leaveMap } = await getEmployeeStats(employeeIds, start, end);

  const rows = employees.map((e) => ({
    id: e.id,
    employeeId: e.employeeId,
    fullName: e.fullName,
    email: e.email,
    phone: e.phone,
    department: (e.department as unknown as NameRef)?.name ?? null,
    designation: (e.designation as unknown as NameRef)?.name ?? null,
    role: e.role,
    status: e.status,
    joiningDate: e.joiningDate,
    presentDays: presentMap.get(e.id) ?? 0,
    leaveDays: leaveMap.get(e.id) ?? 0,
  }));

  return { rows, period: { start, end }, pagination };
}

function buildEmployeeFilter(filters: EmployeeReportFilters): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  if (filters.search) {
    const regex = new RegExp(escapeRegex(filters.search.trim()), "i");
    filter.$or = [{ employeeId: regex }, { fullName: regex }, { email: regex }, { phone: regex }];
  }
  if (filters.department) filter.department = filters.department;
  if (filters.designation) filter.designation = filters.designation;
  if (filters.role) filter.role = filters.role;
  if (filters.status) filter.status = filters.status;
  return filter;
}

export async function exportEmployeeReportCsv(
  actor: Actor,
  filters: EmployeeReportFilters
): Promise<string> {
  const { start, end } = resolveRange(filters.startDate, filters.endDate);
  const filter = buildEmployeeFilter(filters);

  const users = await UserModel.find(filter)
    .populate([
      { path: "department", select: "name" },
      { path: "designation", select: "name" },
    ])
    .sort({ fullName: 1 });

  const employeeIds = users.map((u) => u._id);
  const { presentMap, leaveMap } = await getEmployeeStats(employeeIds, start, end);

  const header = [
    "Employee ID",
    "Full Name",
    "Email",
    "Phone",
    "Department",
    "Designation",
    "Role",
    "Status",
    "Joining Date",
    "Present Days",
    "Leave Days",
  ];

  const rows = users.map((u) => {
    const dept = u.department as unknown as NameRef;
    const desig = u.designation as unknown as NameRef;
    const id = String(u._id);
    return [
      u.employeeId,
      u.fullName,
      u.email,
      u.phone,
      dept?.name ?? "",
      desig?.name ?? "",
      u.role,
      u.status,
      getISTDateString(u.joiningDate),
      (presentMap.get(id) ?? 0).toString(),
      (leaveMap.get(id) ?? 0).toString(),
    ];
  });

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.REPORT_EXPORTED,
    targetType: "Report",
    targetId: actor.id,
    metadata: { reportType: "employee", rowCount: rows.length },
  });

  await notifyUser({
    user: actor.id,
    type: NOTIFICATION_TYPES.SYSTEM,
    title: "Report export ready",
    message: `Your Employee Report export (${rows.length} row${rows.length === 1 ? "" : "s"}) completed`,
    metadata: { reportType: "employee" },
  });

  return exporters.csv(header, rows).content;
}

/* ------------------------------------------------------------------ */
/* Department Report                                                   */
/* ------------------------------------------------------------------ */

export interface DepartmentReportQuery {
  startDate?: string;
  endDate?: string;
  sortBy?: "name" | "totalEmployees";
  sortOrder?: "asc" | "desc";
}

async function countWorkingDays(start: string, end: string): Promise<number> {
  const holidays = await HolidayModel.find({ isActive: true, date: { $gte: start, $lte: end } }).select("date");
  const holidaySet = new Set(holidays.map((h) => h.date));
  return enumerateISTDateStrings(start, end).filter(
    (d) => !isConfiguredWeekend(new Date(`${d}T12:00:00+05:30`)) && !holidaySet.has(d)
  ).length;
}

export async function getDepartmentReport(query: DepartmentReportQuery) {
  const { start, end } = resolveRange(query.startDate, query.endDate);

  const [departments, employeeCounts, presentAgg, leaveAgg, workingDays] = await Promise.all([
    DepartmentModel.find({}).sort({ name: 1 }),
    UserModel.aggregate([
      { $match: { department: { $ne: null } } },
      {
        $group: {
          _id: "$department",
          total: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $in: ["$status", [EMPLOYEE_STATUS.ACTIVE, EMPLOYEE_STATUS.NOTICE_PERIOD]] }, 1, 0],
            },
          },
          noticePeriod: {
            $sum: { $cond: [{ $eq: ["$status", EMPLOYEE_STATUS.NOTICE_PERIOD] }, 1, 0] },
          },
          resigned: {
            $sum: { $cond: [{ $eq: ["$status", EMPLOYEE_STATUS.RESIGNED] }, 1, 0] },
          },
          terminated: {
            $sum: { $cond: [{ $eq: ["$status", EMPLOYEE_STATUS.TERMINATED] }, 1, 0] },
          },
        },
      },
    ]),
    AttendanceModel.aggregate([
      { $match: { date: { $gte: start, $lte: end }, checkIn: { $ne: null } } },
      { $lookup: { from: "users", localField: "employee", foreignField: "_id", as: "employee" } },
      { $unwind: "$employee" },
      { $match: { "employee.department": { $ne: null } } },
      { $group: { _id: "$employee.department", presentDays: { $sum: 1 } } },
    ]),
    LeaveRequestModel.aggregate([
      { $match: { status: LEAVE_REQUEST_STATUS.APPROVED, startDate: { $lte: end }, endDate: { $gte: start } } },
      { $lookup: { from: "users", localField: "employee", foreignField: "_id", as: "employee" } },
      { $unwind: "$employee" },
      { $match: { "employee.department": { $ne: null } } },
      { $group: { _id: "$employee.department", leaveDays: { $sum: "$days" } } },
    ]),
    countWorkingDays(start, end),
  ]);

  const countMap = new Map<
    string,
    { total: number; active: number; noticePeriod: number; resigned: number; terminated: number }
  >(
    employeeCounts.map((r) => [
      String(r._id),
      {
        total: r.total,
        active: r.active,
        noticePeriod: r.noticePeriod,
        resigned: r.resigned,
        terminated: r.terminated,
      },
    ])
  );
  const presentMap = new Map<string, number>(presentAgg.map((r) => [String(r._id), r.presentDays as number]));
  const leaveMap = new Map<string, number>(leaveAgg.map((r) => [String(r._id), r.leaveDays as number]));

  let rows = departments.map((d) => {
    const id = toId(d);
    const counts = countMap.get(id);
    const totalEmployees = counts?.total ?? 0;
    const activeEmployees = counts?.active ?? 0;
    const presentDays = presentMap.get(id) ?? 0;
    const expectedDays = activeEmployees * workingDays;
    const attendancePercentage =
      expectedDays > 0 ? Math.round((presentDays / expectedDays) * 10000) / 100 : 0;

    return {
      id,
      name: d.name,
      totalEmployees,
      activeEmployees,
      noticePeriod: counts?.noticePeriod ?? 0,
      resigned: counts?.resigned ?? 0,
      terminated: counts?.terminated ?? 0,
      attendancePercentage,
      totalLeaveDays: leaveMap.get(id) ?? 0,
    };
  });

  const sortBy = query.sortBy ?? "name";
  const dir = query.sortOrder === "desc" ? -1 : 1;
  rows = [...rows].sort((a, b) =>
    sortBy === "totalEmployees"
      ? (a.totalEmployees - b.totalEmployees) * dir
      : a.name.localeCompare(b.name) * dir
  );

  return { rows, period: { start, end, workingDays } };
}

/* ------------------------------------------------------------------ */
/* Monthly Summary Report                                              */
/* ------------------------------------------------------------------ */

export interface MonthlySummaryReportQuery {
  page: number;
  limit: number;
  year: number;
  month: number;
  department?: string;
  designation?: string;
  search?: string;
  sortBy: "fullName" | "employeeId" | "joiningDate" | "createdAt";
  sortOrder: "asc" | "desc";
}

export async function getMonthlySummaryReport(query: MonthlySummaryReportQuery) {
  const { employees, pagination } = await listEmployees({
    page: query.page,
    limit: query.limit,
    search: query.search,
    department: query.department,
    designation: query.designation,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });

  // Bounded to one page of employees (<= limit, capped at 100 by the
  // route schema). Reuses Phase 4/5's exact attendance-derivation rules
  // (weekend/holiday/leave integration) via Promise.all rather than
  // re-implementing that business logic as a second, divergent
  // aggregation — a deliberate reuse-over-duplication tradeoff.
  const summaries = await Promise.all(
    employees.map((e) => getMonthSummary(e.id, query.year, query.month))
  );

  const rows = employees.map((e, i) => ({
    id: e.id,
    employeeId: e.employeeId,
    fullName: e.fullName,
    department: (e.department as unknown as NameRef)?.name ?? null,
    designation: (e.designation as unknown as NameRef)?.name ?? null,
    summary: summaries[i],
  }));

  return { rows, year: query.year, month: query.month, pagination };
}

/* ------------------------------------------------------------------ */
/* Print activity logging                                              */
/* ------------------------------------------------------------------ */

export async function logReportPrint(actor: Actor, reportType: string): Promise<void> {
  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.REPORT_PRINTED,
    targetType: "Report",
    targetId: actor.id,
    metadata: { reportType },
  });
}
