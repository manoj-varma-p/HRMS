import { z } from "zod";

export const listDepartmentsSchema = z.object({
  query: z.object({
    includeInactive: z.coerce.boolean().optional().default(false),
  }),
});

export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
  }),
});

export const updateDepartmentSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
  }),
});

export const setDepartmentActiveSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});
