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

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const setDepartmentHeadSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    // Required, not optional — unlike updateDepartmentSchema (a partial
    // field update where omission means "don't touch this"), this is a
    // single-purpose set/clear action: the caller must always say what
    // they want. null clears the head; an id sets it. An omitted key is
    // rejected with a 422, not silently treated as either.
    headEmployeeId: objectId.nullable(),
  }),
});
