import { z } from "zod";
import { HOLIDAY_TYPES } from "./holiday.model";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const listHolidaysSchema = z.object({
  query: z.object({
    includeInactive: z.coerce.boolean().optional().default(false),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
  }),
});

export const createHolidaySchema = z.object({
  body: z.object({
    date: dateString,
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    description: z.string().trim().max(500).optional(),
    type: z.enum([HOLIDAY_TYPES.NATIONAL, HOLIDAY_TYPES.COMPANY, HOLIDAY_TYPES.OPTIONAL]),
  }),
});

export const updateHolidaySchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    date: dateString.optional(),
    name: z.string().trim().min(2).optional(),
    description: z.string().trim().max(500).nullable().optional(),
    type: z.enum([HOLIDAY_TYPES.NATIONAL, HOLIDAY_TYPES.COMPANY, HOLIDAY_TYPES.OPTIONAL]).optional(),
  }),
});

export const setHolidayActiveSchema = z.object({
  params: z.object({ id: objectId }),
});
