import { ATTENDANCE_STATUS } from "../../shared/constants/attendanceStatus";
import { EMPLOYEE_STATUS, EmployeeStatus } from "../../shared/constants/employeeStatus";
import { LEAVE_REQUEST_STATUS } from "../../shared/constants/leaveTypes";
import { getISTDateString } from "../../shared/utils/istDate";
import { listRecentActivity } from "../activity-log/activity-log.service";
import { AttendanceModel } from "../attendance/attendance.model";
import { LeaveRequestModel } from "../leave/leave-request.model";
import { UserModel } from "../user/user.model";
import { isConfiguredWeekend } from "../configuration/configuration.cache";

const ACTIVE_LIKE_STATUSES: EmployeeStatus[] = [
  EMPLOYEE_STATUS.ACTIVE,
  EMPLOYEE_STATUS.NOTICE_PERIOD,
];

async function getKpis() {
  const todayStr = getISTDateString(new Date());

  const [totalEmployees, activeEmployees, todayRecords, onLeaveToday, pendingLeaveRequests] =
    await Promise.all([
      UserModel.countDocuments({}),
      UserModel.countDocuments({ status: { $in: ACTIVE_LIKE_STATUSES } }),
      AttendanceModel.find({ date: todayStr }),
      LeaveRequestModel.countDocuments({
        status: LEAVE_REQUEST_STATUS.APPROVED,
        startDate: { $lte: todayStr },
        endDate: { $gte: todayStr },
      }),
      LeaveRequestModel.countDocuments({ status: LEAVE_REQUEST_STATUS.PENDING }),
    ]);

  const checkedInToday = todayRecords.filter((r) => r.checkIn).length;
  const lateToday = todayRecords.filter((r) => r.status === ATTENDANCE_STATUS.LATE).length;

  return {
    totalEmployees,
    activeEmployees,
    presentToday: checkedInToday,
    checkedInToday,
    notCheckedInToday: Math.max(0, activeEmployees - checkedInToday),
    lateToday,
    onLeaveToday,
    pendingLeaveRequests,
  };
}

/**
 * Last N calendar days: present/on-leave/absent counts across every
 * active employee. Two queries total (not one per day) — the per-day
 * breakdown is computed in memory from those two result sets.
 */
async function getDailyAttendanceTrend(days = 14) {
  const today = new Date();
  const dateStrings: string[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    dateStrings.push(getISTDateString(d));
  }
  const start = dateStrings[0];
  const end = dateStrings[dateStrings.length - 1];

  const [records, leaves, activeEmployees] = await Promise.all([
    AttendanceModel.find({ date: { $gte: start, $lte: end } }).select("date checkIn"),
    LeaveRequestModel.find({
      status: LEAVE_REQUEST_STATUS.APPROVED,
      startDate: { $lte: end },
      endDate: { $gte: start },
    }).select("startDate endDate"),
    UserModel.countDocuments({ status: { $in: ACTIVE_LIKE_STATUSES } }),
  ]);

  const presentByDate = new Map<string, number>();
  for (const r of records) {
    if (!r.checkIn) continue;
    presentByDate.set(r.date, (presentByDate.get(r.date) ?? 0) + 1);
  }

  return dateStrings.map((dateStr) => {
    const isWeekend = isConfiguredWeekend(new Date(`${dateStr}T12:00:00+05:30`));
    const present = presentByDate.get(dateStr) ?? 0;
    const onLeave = leaves.filter(
      (l) => l.startDate <= dateStr && l.endDate >= dateStr
    ).length;
    const absent = isWeekend ? 0 : Math.max(0, activeEmployees - present - onLeave);

    return { date: dateStr, present, onLeave, absent, isWeekend };
  });
}

/**
 * Last N months: total present-days and leave-requests-started, via two
 * aggregation queries grouped by the "YYYY-MM" prefix of the date string.
 * Deliberately lighter-weight than the daily trend (no per-employee
 * absent gap-fill) — a summary chart doesn't need day-level precision.
 */
async function getMonthlyAttendanceTrend(months = 6) {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1 - (months - 1);
  while (month <= 0) {
    month += 12;
    year -= 1;
  }
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = getISTDateString(now);

  const monthKeys: string[] = [];
  let y = year;
  let m = month;
  for (let i = 0; i < months; i += 1) {
    monthKeys.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }

  const [presentAgg, leaveAgg] = await Promise.all([
    AttendanceModel.aggregate([
      { $match: { date: { $gte: start, $lte: end }, checkIn: { $ne: null } } },
      { $group: { _id: { $substr: ["$date", 0, 7] }, count: { $sum: 1 } } },
    ]),
    LeaveRequestModel.aggregate([
      {
        $match: {
          status: LEAVE_REQUEST_STATUS.APPROVED,
          startDate: { $gte: start, $lte: end },
        },
      },
      { $group: { _id: { $substr: ["$startDate", 0, 7] }, count: { $sum: 1 } } },
    ]),
  ]);

  const presentMap = new Map<string, number>(presentAgg.map((a) => [a._id, a.count]));
  const leaveMap = new Map<string, number>(leaveAgg.map((a) => [a._id, a.count]));

  return monthKeys.map((key) => ({
    month: key,
    present: presentMap.get(key) ?? 0,
    leaves: leaveMap.get(key) ?? 0,
  }));
}

async function getLeaveAnalytics(year: number) {
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;

  const [byType, byStatus] = await Promise.all([
    LeaveRequestModel.aggregate([
      {
        $match: {
          status: LEAVE_REQUEST_STATUS.APPROVED,
          startDate: { $gte: start, $lte: end },
        },
      },
      { $group: { _id: "$leaveType", count: { $sum: 1 } } },
    ]),
    LeaveRequestModel.aggregate([
      { $match: { startDate: { $gte: start, $lte: end } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  return {
    byType: byType.map((t) => ({ leaveType: t._id as string, count: t.count as number })),
    byStatus: byStatus.map((s) => ({ status: s._id as string, count: s.count as number })),
  };
}

async function getDepartmentBreakdown() {
  const rows = await UserModel.aggregate([
    { $match: { department: { $ne: null } } },
    { $group: { _id: "$department", count: { $sum: 1 } } },
    {
      $lookup: {
        from: "departments",
        localField: "_id",
        foreignField: "_id",
        as: "department",
      },
    },
    { $unwind: "$department" },
    { $project: { _id: 0, name: "$department.name", count: 1 } },
  ]);
  return rows as { name: string; count: number }[];
}

async function getDesignationBreakdown() {
  const rows = await UserModel.aggregate([
    { $match: { designation: { $ne: null } } },
    { $group: { _id: "$designation", count: { $sum: 1 } } },
    {
      $lookup: {
        from: "designations",
        localField: "_id",
        foreignField: "_id",
        as: "designation",
      },
    },
    { $unwind: "$designation" },
    { $project: { _id: 0, name: "$designation.name", count: 1 } },
  ]);
  return rows as { name: string; count: number }[];
}

async function getEmployeeStatusBreakdown() {
  const rows = await UserModel.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
  const counts = new Map<string, number>(rows.map((r) => [r._id, r.count]));
  return Object.values(EMPLOYEE_STATUS).map((status) => ({
    status,
    count: counts.get(status) ?? 0,
  }));
}

export async function getAdminDashboard() {
  const [
    kpis,
    dailyTrend,
    monthlyTrend,
    leaveAnalytics,
    departmentBreakdown,
    designationBreakdown,
    employeeStatusBreakdown,
    recentActivity,
  ] = await Promise.all([
    getKpis(),
    getDailyAttendanceTrend(),
    getMonthlyAttendanceTrend(),
    getLeaveAnalytics(new Date().getFullYear()),
    getDepartmentBreakdown(),
    getDesignationBreakdown(),
    getEmployeeStatusBreakdown(),
    listRecentActivity(10),
  ]);

  return {
    kpis,
    dailyTrend,
    monthlyTrend,
    leaveAnalytics,
    departmentBreakdown,
    designationBreakdown,
    employeeStatusBreakdown,
    recentActivity,
  };
}
