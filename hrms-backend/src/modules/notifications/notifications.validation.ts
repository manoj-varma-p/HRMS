import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const listNotificationsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    unreadOnly: z.coerce.boolean().optional().default(false),
  }),
});

export const markReadSchema = z.object({
  params: z.object({ id: objectId }),
});
