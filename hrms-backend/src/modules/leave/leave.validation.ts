import { z } from "zod";
import { LEAVE_REQUEST_STATUS, LEAVE_TYPES } from "../../shared/constants/leaveTypes";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const applyLeaveSchema = z.object({
  body: z.object({
    leaveType: z.enum(Object.values(LEAVE_TYPES) as [string, ...string[]]),
    startDate: dateString,
    endDate: dateString,
    reason: z.string().trim().min(5, "Please provide a reason (at least 5 characters)"),
  }),
});

export const listLeavesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    status: z.enum(Object.values(LEAVE_REQUEST_STATUS) as [string, ...string[]]).optional(),
    leaveType: z.enum(Object.values(LEAVE_TYPES) as [string, ...string[]]).optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
  }),
});

export const adminListLeavesSchema = z.object({
  query: listLeavesSchema.shape.query.extend({
    employeeId: objectId.optional(),
    department: objectId.optional(),
    designation: objectId.optional(),
  }),
});

export const balanceQuerySchema = z.object({
  query: z.object({
    employeeId: objectId.optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
  }),
});

export const leaveIdParamSchema = z.object({
  params: z.object({ id: objectId }),
});

export const reviewLeaveSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    comment: z.string().trim().max(500).optional(),
  }),
});

export const grantExtraLeaveSchema = z.object({
  body: z.object({
    employeeId: objectId,
    days: z.coerce.number().positive("Days must be greater than 0"),
    reason: z.string().trim().min(3, "Reason required"),
    leaveType: z.enum(Object.values(LEAVE_TYPES) as [string, ...string[]]).optional(),
    period: z.enum(["H1", "H2", "ANNUAL"]).optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
  }),
});
