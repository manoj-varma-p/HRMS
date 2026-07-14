import { z } from "zod";
import { ROLES } from "../../shared/constants/roles";
import { EMPLOYEE_STATUS } from "../../shared/constants/employeeStatus";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");
const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9\s-]{6,18}$/, "Enter a valid phone number");
// An optional date field whose client-side counterpart is a plain
// <input type="date">: an unset value arrives as "", which z.coerce.date()
// would otherwise turn into an Invalid Date and reject outright rather
// than treating as "not provided." Treated as undefined instead.
const optionalDate = z
  .union([z.literal(""), z.coerce.date()])
  .optional()
  .transform((v) => (v === "" ? undefined : v));
// Unlike optionalDate, an empty value here is meaningful — it means
// "clear the override, go back to the company default" — so it maps to
// null (an explicit value to save), not undefined (field left untouched).
// z.null() has to be listed explicitly, not just z.literal("") — without it,
// a literal JSON `null` falls through to z.coerce.number(), and
// Number(null) === 0, silently saving "0 minutes grace" instead of clearing
// the override.
const optionalGraceMinutes = z
  .union([z.literal(""), z.null(), z.coerce.number().int().min(0).max(480)])
  .optional()
  .transform((v) => (v === "" || v === null ? null : v));

export const listEmployeesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    search: z.string().trim().optional(),
    department: objectId.optional(),
    designation: objectId.optional(),
    role: z.enum(Object.values(ROLES) as [string, ...string[]]).optional(),
    status: z
      .enum(Object.values(EMPLOYEE_STATUS) as [string, ...string[]])
      .optional(),
    sortBy: z
      .enum(["fullName", "employeeId", "joiningDate", "createdAt"])
      .optional()
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});

export const createEmployeeSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
    email: z.string().trim().email("Enter a valid email address"),
    phone,
    department: objectId,
    designation: objectId,
    joiningDate: z.coerce.date(),
    dateOfBirth: optionalDate,
    role: z.enum([ROLES.EMPLOYEE, ROLES.ADMIN]),
    status: z
      .enum(Object.values(EMPLOYEE_STATUS) as [string, ...string[]])
      .optional()
      .default(EMPLOYEE_STATUS.ACTIVE),
  }),
});

export const updateEmployeeSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    fullName: z.string().trim().min(2).optional(),
    phone: phone.optional(),
    department: objectId.optional(),
    designation: objectId.optional(),
    dateOfBirth: optionalDate,
    gracePeriodOverrideMinutes: optionalGraceMinutes,
    // SUPER_ADMIN not assignable here, same restriction as creation.
    role: z.enum([ROLES.EMPLOYEE, ROLES.ADMIN]).optional(),
    status: z
      .enum(Object.values(EMPLOYEE_STATUS) as [string, ...string[]])
      .optional(),
  }),
});

export const getEmployeeSchema = z.object({
  params: z.object({ id: objectId }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    phone: phone.optional(),
    dateOfBirth: optionalDate,
    address: z.string().trim().max(500).optional(),
    profilePhoto: z.string().trim().url().optional(),
    emergencyContact: z
      .object({
        name: z.string().trim().min(2),
        phone,
      })
      .optional(),
  }),
});
