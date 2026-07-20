import crypto from "node:crypto";
import { ApiError } from "../../shared/errors/ApiError";
import { ROLES, Role } from "../../shared/constants/roles";
import { ACTIVITY_ACTIONS } from "../../shared/constants/activityActions";
import { TASK_STATUS, TASK_PRIORITY, TaskStatus, TaskPriority } from "../../shared/constants/taskTypes";
import { NOTIFICATION_TYPES } from "../../shared/constants/notificationTypes";
import { CounterModel } from "../../shared/models/counter.model";
import { toId } from "../../shared/utils/toId";
import { escapeRegex } from "../../shared/utils/regex";
import { getISTDateString } from "../../shared/utils/istDate";
import { uploadObject, deleteObject, getSignedDownloadUrl } from "../../shared/services/s3.client";
import { recordActivity } from "../activity-log/activity-log.service";
import { notifyUser } from "../notifications/notifications.service";
import { UserModel } from "../user/user.model";
import { DepartmentModel } from "../department/department.model";
import { ITask, TaskModel } from "./task.model";
import { ITaskComment, TaskCommentModel } from "./task-comment.model";
import {
  ITaskAttachment,
  TASK_ATTACHMENT_STATUS,
  TaskAttachmentModel,
} from "./task-attachment.model";
import {
  canChangeTaskStatus,
  canViewTask,
  isRequestChangesTransition,
  isTaskOverdue,
  isTaskReopenTransition,
  isValidTaskStatusTransition,
} from "./task.util";

interface Actor {
  id: string;
  role: Role;
  employeeId: string;
}

const TASK_ID_PREFIX = "TASK-";
const TASK_ID_PAD = 4;
const TASK_ID_COUNTER = "taskId";

// Atomic $inc counter, same mechanism as employee.service.ts's
// getNextEmployeeId — simpler here since Task is a brand-new collection
// (no pre-existing "TASK-####" data to reconcile the counter against on
// first use, unlike EMP-#### which had to bootstrap from seed data).
async function getNextTaskId(): Promise<string> {
  const counter = await CounterModel.findByIdAndUpdate(
    TASK_ID_COUNTER,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `${TASK_ID_PREFIX}${String(counter!.seq).padStart(TASK_ID_PAD, "0")}`;
}

// Reused everywhere a taskId param needs to resolve to a real document
// before anything else happens, per the Phase 1 architecture review —
// every mutating/reading endpoint below calls this once instead of
// repeating `findById` + 404 checks inline.
async function assertTaskExists(taskId: string): Promise<ITask> {
  const task = await TaskModel.findById(taskId);
  if (!task) throw new ApiError(404, "Task not found");
  return task;
}

// Live query, deliberately not department.cache.ts's getDepartmentsHeadedBy
// — that cache exists only to serve /auth/me's display field cheaply and
// can lag up to its refresh interval behind a real change. Every actual
// permission decision here reads the current value directly.
async function isDepartmentHeadOf(actorId: string, departmentId: string | null): Promise<boolean> {
  if (!departmentId) return false;
  const department = await DepartmentModel.findOne({
    _id: departmentId,
    headEmployeeId: actorId,
  }).select("_id");
  return department !== null;
}

async function getHeadedDepartmentIds(actorId: string): Promise<string[]> {
  const departments = await DepartmentModel.find({ headEmployeeId: actorId }).select("_id");
  return departments.map((d) => toId(d));
}

/** Detail view, comments, attachments — the one three/four-way visibility rule (TDS §6/§8). */
async function assertCanViewTask(actor: Actor, task: ITask): Promise<void> {
  const isHead = await isDepartmentHeadOf(actor.id, task.department ? String(task.department) : null);
  const allowed = canViewTask({
    actorId: actor.id,
    actorRole: actor.role,
    assignedTo: String(task.assignedTo),
    assignedBy: String(task.assignedBy),
    isDepartmentHeadOfTask: isHead,
  });
  if (!allowed) throw new ApiError(403, "You do not have access to this task");
}

// Edit and cancel share this exact condition in the permission matrix (§6)
// — admin/super admin may manage any task; a department head may manage
// only their own department's tasks; nobody else may manage a task at all.
// Named to match document.service.ts's assertCanManage precedent.
async function assertCanManageTask(actor: Actor, task: ITask): Promise<void> {
  if (actor.role === ROLES.SUPER_ADMIN || actor.role === ROLES.ADMIN) return;
  const isHead = await isDepartmentHeadOf(actor.id, task.department ? String(task.department) : null);
  if (!isHead) throw new ApiError(403, "You do not have permission to manage this task");
}

// Shared by task creation (target = the new assignee's department) and
// reassignment (target = the new assignee's department, in addition to
// assertCanManageTask on the existing task) — a department head may only
// ever assign work within the department(s) they head; admin/super admin
// have no such restriction (TDS Assumption 2).
async function assertCanAssignInto(actor: Actor, departmentId: string | null): Promise<void> {
  if (actor.role === ROLES.SUPER_ADMIN || actor.role === ROLES.ADMIN) return;
  const isHead = await isDepartmentHeadOf(actor.id, departmentId);
  if (!isHead) {
    throw new ApiError(403, "You can only assign tasks within a department you head");
  }
}

async function assertCanChangeStatus(actor: Actor, task: ITask, to: TaskStatus): Promise<void> {
  const isHead = await isDepartmentHeadOf(actor.id, task.department ? String(task.department) : null);

  // A complete stranger (not assignee/assigner/admin/department-head) gets
  // 403 here rather than falling through to canChangeTaskStatus's 409 —
  // "you can't even see this task" is an authorization failure, not a
  // state conflict. Reuses the isHead lookup already made above instead of
  // querying department headship twice.
  const canView = canViewTask({
    actorId: actor.id,
    actorRole: actor.role,
    assignedTo: String(task.assignedTo),
    assignedBy: String(task.assignedBy),
    isDepartmentHeadOfTask: isHead,
  });
  if (!canView) {
    throw new ApiError(403, "You do not have access to this task");
  }

  const allowed = canChangeTaskStatus({
    actorId: actor.id,
    actorRole: actor.role,
    assignedTo: String(task.assignedTo),
    isDepartmentHeadOfTask: isHead,
    from: task.status,
    to,
  });
  if (!allowed) {
    throw new ApiError(409, `Cannot move this task from ${task.status} to ${to}`);
  }
}

// "✅ Own uploads only" for a plain employee, plus admin/department-head —
// the same manage rule as assertCanManageTask, widened by one more allowed
// actor (the uploader).
async function assertCanDeleteAttachment(
  actor: Actor,
  task: ITask,
  attachment: ITaskAttachment
): Promise<void> {
  if (String(attachment.uploadedBy) === actor.id) return;
  await assertCanManageTask(actor, task);
}

const TASK_POPULATE_FIELDS = [
  { path: "assignedTo", select: "fullName employeeId" },
  { path: "assignedBy", select: "fullName employeeId" },
  { path: "department", select: "name" },
];

function toPublicTask(task: ITask, todayStr: string) {
  return {
    id: toId(task),
    taskId: task.taskId,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    assignedBy: task.assignedBy,
    assignedTo: task.assignedTo,
    department: task.department,
    parentTask: task.parentTask,
    dueDate: task.dueDate,
    overdue: isTaskOverdue(task.dueDate, task.status, todayStr),
    completedAt: task.completedAt,
    revisionCount: task.revisionCount,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

function toPublicComment(comment: ITaskComment) {
  return {
    id: toId(comment),
    task: comment.task,
    author: comment.author,
    body: comment.body,
    createdAt: comment.createdAt,
  };
}

function toPublicAttachment(attachment: ITaskAttachment) {
  return {
    id: toId(attachment),
    task: attachment.task,
    originalFileName: attachment.originalFileName,
    mimeType: attachment.mimeType,
    fileSizeBytes: attachment.fileSizeBytes,
    status: attachment.status,
    uploadedBy: attachment.uploadedBy,
    deletedAt: attachment.deletedAt,
    createdAt: attachment.createdAt,
  };
}

interface CreateTaskInput {
  title: string;
  description?: string;
  assignedTo: string;
  priority?: TaskPriority;
  dueDate?: string;
  parentTask?: string;
}

export async function createTask(actor: Actor, input: CreateTaskInput) {
  const assignee = await UserModel.findById(input.assignedTo).select("department");
  if (!assignee) throw new ApiError(404, "Assignee not found");

  const departmentId = assignee.department ? String(assignee.department) : null;
  await assertCanAssignInto(actor, departmentId);

  if (input.parentTask) {
    const parent = await TaskModel.findById(input.parentTask).select("parentTask");
    if (!parent) throw new ApiError(404, "Parent task not found");
    // Sub-tasks are one level deep by convention (TDS §12 risk) — a
    // sub-task's own parent must itself be a top-level task.
    if (parent.parentTask) {
      throw new ApiError(422, "Cannot create a sub-task of a sub-task");
    }
  }

  const taskId = await getNextTaskId();
  const task = await TaskModel.create({
    taskId,
    title: input.title,
    description: input.description ?? null,
    assignedBy: actor.id,
    assignedTo: input.assignedTo,
    department: departmentId,
    parentTask: input.parentTask ?? null,
    dueDate: input.dueDate ?? null,
    priority: input.priority ?? TASK_PRIORITY.MEDIUM,
  });
  await task.populate(TASK_POPULATE_FIELDS);

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.TASK_CREATED,
    targetType: "Task",
    targetId: toId(task),
    metadata: { taskId: task.taskId, assignedTo: input.assignedTo, title: input.title },
  });

  await notifyUser({
    user: input.assignedTo,
    type: NOTIFICATION_TYPES.TASK_ASSIGNED,
    title: "New task assigned",
    message: `You've been assigned "${task.title}" (${task.taskId})`,
    metadata: { taskId: toId(task) },
  });

  return toPublicTask(task, getISTDateString());
}

interface MyTasksQuery {
  page: number;
  limit: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
}

export async function listMyTasks(actor: Actor, query: MyTasksQuery) {
  const filter: Record<string, unknown> = { assignedTo: actor.id };
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.search) {
    filter.title = new RegExp(escapeRegex(query.search.trim()), "i");
  }

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    TaskModel.find(filter)
      .populate(TASK_POPULATE_FIELDS)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit),
    TaskModel.countDocuments(filter),
  ]);

  const todayStr = getISTDateString();
  return {
    tasks: items.map((task) => toPublicTask(task, todayStr)),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

interface TeamTasksQuery {
  page: number;
  limit: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
}

export async function listTeamTasks(actor: Actor, query: TeamTasksQuery) {
  const departmentIds = await getHeadedDepartmentIds(actor.id);
  if (departmentIds.length === 0) {
    throw new ApiError(403, "You are not the head of any department");
  }

  const filter: Record<string, unknown> = { department: { $in: departmentIds } };
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.assignedTo) filter.assignedTo = query.assignedTo;

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    TaskModel.find(filter)
      .populate(TASK_POPULATE_FIELDS)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit),
    TaskModel.countDocuments(filter),
  ]);

  const todayStr = getISTDateString();
  return {
    tasks: items.map((task) => toPublicTask(task, todayStr)),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

interface AdminTasksQuery {
  page: number;
  limit: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  department?: string;
  assignedTo?: string;
  assignedBy?: string;
  overdue?: boolean;
  search?: string;
}

// Route-gated to Admin/Super Admin only (see task.routes.ts) — no
// additional service-level permission check needed, unlike every other
// list/detail function here.
export async function adminListTasks(query: AdminTasksQuery) {
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.department) filter.department = query.department;
  if (query.assignedTo) filter.assignedTo = query.assignedTo;
  if (query.assignedBy) filter.assignedBy = query.assignedBy;
  if (query.search) {
    filter.title = new RegExp(escapeRegex(query.search.trim()), "i");
  }

  const todayStr = getISTDateString();
  // "Overdue" isn't a stored field, so it can't be a Mongo filter directly
  // — expressed instead as the same two conditions isTaskOverdue checks
  // (dueDate before today, status not DONE/CANCELLED), which stays index
  // -friendly against the { dueDate: 1 } index rather than an in-memory
  // scan (TDS §12 performance risk).
  if (query.overdue) {
    filter.dueDate = { $ne: null, $lt: todayStr };
    // Only default the DONE/CANCELLED exclusion when the caller didn't
    // already ask for a specific status — an explicit status filter
    // combined with overdue=true is respected as-is (a self-contradictory
    // combination like status=DONE&overdue=true legitimately yields zero
    // results, it doesn't silently override what the caller asked for).
    if (!query.status) {
      filter.status = { $nin: [TASK_STATUS.DONE, TASK_STATUS.CANCELLED] };
    }
  }

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    TaskModel.find(filter)
      .populate(TASK_POPULATE_FIELDS)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit),
    TaskModel.countDocuments(filter),
  ]);

  return {
    tasks: items.map((task) => toPublicTask(task, todayStr)),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function getTaskById(actor: Actor, taskId: string) {
  const task = await assertTaskExists(taskId);
  await assertCanViewTask(actor, task);
  await task.populate(TASK_POPULATE_FIELDS);
  return toPublicTask(task, getISTDateString());
}

interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  dueDate?: string | null;
}

export async function updateTask(actor: Actor, taskId: string, input: UpdateTaskInput) {
  const task = await assertTaskExists(taskId);
  await assertCanManageTask(actor, task);

  if (input.title !== undefined) task.title = input.title;
  if (input.description !== undefined) task.description = input.description;
  if (input.priority !== undefined) task.priority = input.priority;
  if (input.dueDate !== undefined) task.dueDate = input.dueDate;
  await task.save();
  await task.populate(TASK_POPULATE_FIELDS);

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.TASK_UPDATED,
    targetType: "Task",
    targetId: toId(task),
    metadata: { taskId: task.taskId, ...input },
  });

  return toPublicTask(task, getISTDateString());
}

export async function changeTaskStatus(
  actor: Actor,
  taskId: string,
  status: TaskStatus,
  comment?: string
) {
  const task = await assertTaskExists(taskId);
  await assertCanChangeStatus(actor, task, status);

  const previousStatus = task.status;
  const isRequestingChanges = isRequestChangesTransition(previousStatus, status);
  // Captured before .populate() below turns these into populated
  // sub-documents — String(populatedDoc) would not give back a plain id.
  const assignedById = String(task.assignedBy);
  const departmentId = task.department ? String(task.department) : null;
  task.status = status;
  task.completedAt =
    status === TASK_STATUS.DONE ? new Date() : isTaskReopenTransition(previousStatus, status) ? null : task.completedAt;
  if (isRequestingChanges) {
    task.revisionCount += 1;
  }
  await task.save();
  await task.populate(TASK_POPULATE_FIELDS);

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.TASK_STATUS_CHANGED,
    targetType: "Task",
    targetId: toId(task),
    metadata: { taskId: task.taskId, from: previousStatus, to: status },
  });

  // The comment lives in the task's own comment thread rather than a
  // single "reviewComment" field on the task (unlike Leave/Documents,
  // which are only ever reviewed once) — a task can be sent back for
  // changes multiple times, so a single field would just get overwritten
  // on the next round. The prefix is what makes it identifiable as review
  // feedback rather than a regular reply, since TaskComment has no type
  // tag of its own.
  if (isRequestingChanges && comment?.trim()) {
    await TaskCommentModel.create({
      task: taskId,
      author: actor.id,
      body: `Requested changes: ${comment.trim()}`,
    });
  }

  // A task landing in IN_REVIEW is the one moment nobody was otherwise
  // told about — the assigner delegated it and the department head owns
  // the team's output, so both (when they exist and aren't the actor who
  // just submitted it) should hear about it without having to go check.
  if (status === TASK_STATUS.IN_REVIEW) {
    const recipientIds = new Set<string>();
    if (assignedById !== actor.id) recipientIds.add(assignedById);

    if (departmentId) {
      const department = await DepartmentModel.findById(departmentId).select("headEmployeeId");
      if (department?.headEmployeeId) {
        const headId = String(department.headEmployeeId);
        if (headId !== actor.id) recipientIds.add(headId);
      }
    }

    for (const userId of recipientIds) {
      await notifyUser({
        user: userId,
        type: NOTIFICATION_TYPES.TASK_SUBMITTED_FOR_REVIEW,
        title: "Task submitted for review",
        message: `"${task.title}" (${task.taskId}) is ready for your review`,
        metadata: { taskId: toId(task) },
      });
    }
  }

  return toPublicTask(task, getISTDateString());
}

export async function reassignTask(actor: Actor, taskId: string, assignedTo: string) {
  const task = await assertTaskExists(taskId);
  await assertCanManageTask(actor, task);

  const newAssignee = await UserModel.findById(assignedTo).select("department");
  if (!newAssignee) throw new ApiError(404, "Assignee not found");

  const newDepartmentId = newAssignee.department ? String(newAssignee.department) : null;
  await assertCanAssignInto(actor, newDepartmentId);

  const previousAssignee = String(task.assignedTo);
  task.assignedTo = assignedTo as never;
  task.department = newDepartmentId as never;
  await task.save();
  await task.populate(TASK_POPULATE_FIELDS);

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.TASK_REASSIGNED,
    targetType: "Task",
    targetId: toId(task),
    metadata: { taskId: task.taskId, from: previousAssignee, to: assignedTo },
  });

  await notifyUser({
    user: assignedTo,
    type: NOTIFICATION_TYPES.TASK_REASSIGNED,
    title: "Task reassigned to you",
    message: `"${task.title}" (${task.taskId}) has been reassigned to you`,
    metadata: { taskId: toId(task) },
  });

  return toPublicTask(task, getISTDateString());
}

// Cancel is a status change to CANCELLED, not a hard delete — matches
// Leave's soft-terminal-status pattern (TDS §8): task history has no
// independent "restore" value the way a deleted employee record's cascade
// does, so there's no separate purge/restore pair here.
export async function cancelTask(actor: Actor, taskId: string) {
  const task = await assertTaskExists(taskId);
  await assertCanManageTask(actor, task);

  // Reuses the same transition table changeTaskStatus validates against
  // (CANCELLED unreachable from DONE, and CANCELLED itself is terminal) —
  // the permission rule here is narrower than assertCanChangeStatus's
  // (assignees may cancel via PATCH .../status but not via this endpoint,
  // per §6), but which statuses may ever reach CANCELLED must stay defined
  // in exactly one place.
  if (!isValidTaskStatusTransition(task.status, TASK_STATUS.CANCELLED)) {
    throw new ApiError(409, `A task in ${task.status} status cannot be cancelled`);
  }

  task.status = TASK_STATUS.CANCELLED;
  await task.save();
  await task.populate(TASK_POPULATE_FIELDS);

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.TASK_CANCELLED,
    targetType: "Task",
    targetId: toId(task),
    metadata: { taskId: task.taskId },
  });

  return toPublicTask(task, getISTDateString());
}

export async function addTaskComment(actor: Actor, taskId: string, body: string) {
  const task = await assertTaskExists(taskId);
  await assertCanViewTask(actor, task);

  const comment = await TaskCommentModel.create({
    task: taskId,
    author: actor.id,
    body,
  });
  await comment.populate({ path: "author", select: "fullName employeeId" });

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.TASK_COMMENTED,
    targetType: "Task",
    targetId: taskId,
    metadata: { taskId: task.taskId, commentId: toId(comment) },
  });

  return toPublicComment(comment);
}

interface CommentsQuery {
  page: number;
  limit: number;
}

export async function listTaskComments(actor: Actor, taskId: string, query: CommentsQuery) {
  const task = await assertTaskExists(taskId);
  await assertCanViewTask(actor, task);

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    TaskCommentModel.find({ task: taskId })
      .populate({ path: "author", select: "fullName employeeId" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit),
    TaskCommentModel.countDocuments({ task: taskId }),
  ]);

  return {
    comments: items.map(toPublicComment),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-100);
}

function buildTaskAttachmentS3Key(taskId: string, fileName: string): string {
  const unique = crypto.randomUUID();
  return `tasks/${taskId}/attachments/${unique}-${sanitizeFileName(fileName)}`;
}

export async function uploadTaskAttachment(
  actor: Actor,
  taskId: string,
  file: Express.Multer.File
) {
  const task = await assertTaskExists(taskId);
  await assertCanViewTask(actor, task);

  const s3Key = buildTaskAttachmentS3Key(task.taskId, file.originalname);
  await uploadObject(s3Key, file.buffer, file.mimetype);

  const attachment = await TaskAttachmentModel.create({
    task: taskId,
    originalFileName: file.originalname,
    s3Key,
    mimeType: file.mimetype,
    fileSizeBytes: file.size,
    uploadedBy: actor.id,
  });

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.TASK_ATTACHMENT_UPLOADED,
    targetType: "Task",
    targetId: taskId,
    metadata: { taskId: task.taskId, attachmentId: toId(attachment), fileName: file.originalname },
  });

  return toPublicAttachment(attachment);
}

export async function listTaskAttachments(actor: Actor, taskId: string) {
  const task = await assertTaskExists(taskId);
  await assertCanViewTask(actor, task);

  const attachments = await TaskAttachmentModel.find({
    task: taskId,
    status: TASK_ATTACHMENT_STATUS.ACTIVE,
  }).sort({ createdAt: -1 });

  return attachments.map(toPublicAttachment);
}

async function getViewableAttachment(actor: Actor, attachmentId: string): Promise<ITaskAttachment> {
  const attachment = await TaskAttachmentModel.findById(attachmentId);
  if (!attachment) throw new ApiError(404, "Attachment not found");
  const task = await assertTaskExists(String(attachment.task));
  await assertCanViewTask(actor, task);
  return attachment;
}

export async function getTaskAttachmentDownloadUrl(
  actor: Actor,
  attachmentId: string
): Promise<string> {
  const attachment = await getViewableAttachment(actor, attachmentId);
  if (attachment.status !== TASK_ATTACHMENT_STATUS.ACTIVE) {
    throw new ApiError(409, "This attachment has been deleted");
  }
  return getSignedDownloadUrl(attachment.s3Key);
}

export async function deleteTaskAttachment(actor: Actor, attachmentId: string) {
  const attachment = await TaskAttachmentModel.findById(attachmentId);
  if (!attachment) throw new ApiError(404, "Attachment not found");
  const task = await assertTaskExists(String(attachment.task));
  await assertCanDeleteAttachment(actor, task, attachment);

  if (attachment.status === TASK_ATTACHMENT_STATUS.DELETED) {
    throw new ApiError(409, "This attachment is already deleted");
  }

  attachment.status = TASK_ATTACHMENT_STATUS.DELETED;
  attachment.deletedBy = actor.id as never;
  attachment.deletedAt = new Date();
  await attachment.save();
  // Unlike EmployeeDocument's soft delete, this deletes the S3 object
  // immediately rather than only on a later purge — there is no restore
  // endpoint for task attachments (TDS §8 lists none), so keeping the S3
  // object around after this point would just be unreachable, permanently
  // orphaned storage. The DELETED status + deletedBy/deletedAt is kept as
  // an audit trail only, not as a "the file might come back" signal.
  await deleteObject(attachment.s3Key);

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.TASK_ATTACHMENT_DELETED,
    targetType: "Task",
    targetId: toId(task),
    metadata: { taskId: task.taskId, attachmentId: toId(attachment) },
  });

  return toPublicAttachment(attachment);
}
