import { z } from "zod";
import { ATTENDANCE_STATUS } from "../../shared/constants/attendanceStatus";
import { LEAVE_REQUEST_STATUS, LEAVE_TYPES } from "../../shared/constants/leaveTypes";
import { EMPLOYEE_STATUS } from "../../shared/constants/employeeStatus";
import { ROLES } from "../../shared/constants/roles";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

const page = z.coerce.number().int().min(1).optional().default(1);
const limit = z.coerce.number().int().min(1).max(100).optional().default(20);
const startDate = dateString.optional();
const endDate = dateString.optional();
const department = objectId.optional();
const designation = objectId.optional();
const employeeId = objectId.optional();
const search = z.string().trim().min(1).optional();

export const attendanceReportQuerySchema = z.object({
  query: z.object({
    page,
    limit,
    startDate,
    endDate,
    department,
    designation,
    employeeId,
    search,
    status: z.enum(Object.values(ATTENDANCE_STATUS) as [string, ...string[]]).optional(),
    sortBy: z.enum(["date", "employeeName", "status", "workedHours"]).optional().default("date"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});

export const attendanceReportExportQuerySchema = z.object({
  query: attendanceReportQuerySchema.shape.query.omit({
    page: true,
    limit: true,
    sortBy: true,
    sortOrder: true,
  }),
});

export const leaveReportQuerySchema = z.object({
  query: z.object({
    page,
    limit,
    startDate,
    endDate,
    department,
    designation,
    employeeId,
    search,
    leaveType: z.enum(Object.values(LEAVE_TYPES) as [string, ...string[]]).optional(),
    status: z.enum(Object.values(LEAVE_REQUEST_STATUS) as [string, ...string[]]).optional(),
    sortBy: z
      .enum(["startDate", "employeeName", "leaveType", "status", "days", "createdAt"])
      .optional()
      .default("startDate"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});

export const leaveReportExportQuerySchema = z.object({
  query: leaveReportQuerySchema.shape.query.omit({
    page: true,
    limit: true,
    sortBy: true,
    sortOrder: true,
  }),
});

export const employeeReportQuerySchema = z.object({
  query: z.object({
    page,
    limit,
    startDate,
    endDate,
    department,
    designation,
    search,
    role: z.enum(Object.values(ROLES) as [string, ...string[]]).optional(),
    status: z.enum(Object.values(EMPLOYEE_STATUS) as [string, ...string[]]).optional(),
    sortBy: z.enum(["fullName", "employeeId", "joiningDate", "createdAt"]).optional().default("fullName"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
  }),
});

export const employeeReportExportQuerySchema = z.object({
  query: employeeReportQuerySchema.shape.query.omit({
    page: true,
    limit: true,
    sortBy: true,
    sortOrder: true,
  }),
});

export const departmentReportQuerySchema = z.object({
  query: z.object({
    startDate,
    endDate,
    sortBy: z.enum(["name", "totalEmployees"]).optional().default("name"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
  }),
});

export const monthlySummaryReportQuerySchema = z.object({
  query: z.object({
    page,
    limit,
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    department,
    designation,
    search,
    sortBy: z.enum(["fullName", "employeeId", "joiningDate", "createdAt"]).optional().default("fullName"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
  }),
});

export const printLogSchema = z.object({
  body: z.object({
    reportType: z.enum(["attendance", "leave", "employee", "department", "monthly-summary"]),
  }),
});
