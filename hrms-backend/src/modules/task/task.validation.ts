import { z } from "zod";
import { TASK_STATUS, TASK_PRIORITY } from "../../shared/constants/taskTypes";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

// Update-only: distinguishes "field omitted" (undefined, leave untouched)
// from "field explicitly cleared" (null) — same problem/solution as
// employee.validation.ts's optionalGraceMinutes. "" is accepted alongside
// null since a cleared <input> arrives as an empty string, not null.
const optionalNullableDescription = z
  .union([z.literal(""), z.null(), z.string().trim().max(5000)])
  .optional()
  .transform((v) => (v === "" || v === null ? null : v));

const optionalNullableDueDate = z
  .union([z.literal(""), z.null(), dateString])
  .optional()
  .transform((v) => (v === "" || v === null ? null : v));

// The Mongo _id of a Task document, not the human-readable Task.taskId
// display field (e.g. "TASK-0001") — same relationship as
// document.routes.ts's :documentId, which is also always a Mongo _id.
export const taskIdParamSchema = z.object({
  params: z.object({ taskId: objectId }),
});

export const attachmentIdParamSchema = z.object({
  params: z.object({ attachmentId: objectId }),
});

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, "Title is required").max(200),
    description: z.string().trim().max(5000).optional(),
    assignedTo: objectId,
    priority: z.enum(Object.values(TASK_PRIORITY) as [string, ...string[]]).optional(),
    dueDate: dateString.optional(),
    parentTask: objectId.optional(),
  }),
});

export const updateTaskSchema = z.object({
  params: z.object({ taskId: objectId }),
  body: z.object({
    title: z.string().trim().min(1, "Title is required").max(200).optional(),
    description: optionalNullableDescription,
    priority: z.enum(Object.values(TASK_PRIORITY) as [string, ...string[]]).optional(),
    dueDate: optionalNullableDueDate,
  }),
});

export const changeTaskStatusSchema = z.object({
  params: z.object({ taskId: objectId }),
  body: z.object({
    status: z.enum(Object.values(TASK_STATUS) as [string, ...string[]]),
  }),
});

export const reassignTaskSchema = z.object({
  params: z.object({ taskId: objectId }),
  body: z.object({
    assignedTo: objectId,
  }),
});

const paginationQuery = {
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
};

export const listMyTasksSchema = z.object({
  query: z.object({
    ...paginationQuery,
    status: z.enum(Object.values(TASK_STATUS) as [string, ...string[]]).optional(),
    priority: z.enum(Object.values(TASK_PRIORITY) as [string, ...string[]]).optional(),
    search: z.string().trim().optional(),
  }),
});

export const listTeamTasksSchema = z.object({
  query: z.object({
    ...paginationQuery,
    status: z.enum(Object.values(TASK_STATUS) as [string, ...string[]]).optional(),
    priority: z.enum(Object.values(TASK_PRIORITY) as [string, ...string[]]).optional(),
    assignedTo: objectId.optional(),
  }),
});

export const adminListTasksSchema = z.object({
  query: z.object({
    ...paginationQuery,
    status: z.enum(Object.values(TASK_STATUS) as [string, ...string[]]).optional(),
    priority: z.enum(Object.values(TASK_PRIORITY) as [string, ...string[]]).optional(),
    department: objectId.optional(),
    assignedTo: objectId.optional(),
    assignedBy: objectId.optional(),
    overdue: z.coerce.boolean().optional(),
    search: z.string().trim().optional(),
  }),
});

export const addTaskCommentSchema = z.object({
  params: z.object({ taskId: objectId }),
  body: z.object({
    body: z.string().trim().min(1, "Comment cannot be empty").max(2000),
  }),
});

export const listTaskCommentsSchema = z.object({
  params: z.object({ taskId: objectId }),
  query: z.object(paginationQuery),
});
