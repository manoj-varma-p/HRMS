import { z } from "zod";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const listActivitySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    search: z.string().trim().min(1).optional(),
    startDate: dateString.optional(),
    endDate: dateString.optional(),
    action: z.string().trim().min(1).optional(),
    targetType: z.string().trim().min(1).optional(),
  }),
});
