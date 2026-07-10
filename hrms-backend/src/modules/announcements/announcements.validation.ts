import { z } from "zod";
import { ANNOUNCEMENT_PRIORITY, ANNOUNCEMENT_STATUS } from "./announcement.model";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const createAnnouncementSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
    description: z.string().trim().min(3, "Description must be at least 3 characters").max(5000),
    priority: z
      .enum(Object.values(ANNOUNCEMENT_PRIORITY) as [string, ...string[]])
      .optional()
      .default(ANNOUNCEMENT_PRIORITY.MEDIUM),
    expiryDate: dateString.optional(),
  }),
});

export const updateAnnouncementSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    title: z.string().trim().min(3).max(200).optional(),
    description: z.string().trim().min(3).max(5000).optional(),
    priority: z.enum(Object.values(ANNOUNCEMENT_PRIORITY) as [string, ...string[]]).optional(),
    expiryDate: dateString.nullable().optional(),
  }),
});

export const announcementIdSchema = z.object({
  params: z.object({ id: objectId }),
});

export const adminListAnnouncementsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    search: z.string().trim().min(1).optional(),
    status: z.enum(Object.values(ANNOUNCEMENT_STATUS) as [string, ...string[]]).optional(),
    priority: z.enum(Object.values(ANNOUNCEMENT_PRIORITY) as [string, ...string[]]).optional(),
  }),
});

export const listAnnouncementsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    search: z.string().trim().min(1).optional(),
  }),
});
