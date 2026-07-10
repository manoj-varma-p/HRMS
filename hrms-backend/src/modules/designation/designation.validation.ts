import { z } from "zod";

export const listDesignationsSchema = z.object({
  query: z.object({
    includeInactive: z.coerce.boolean().optional().default(false),
  }),
});

export const createDesignationSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
  }),
});

export const updateDesignationSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
  }),
});

export const setDesignationActiveSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});
