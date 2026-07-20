import { ROLES, Role } from "../../shared/constants/roles";
import { TASK_STATUS, TaskStatus } from "../../shared/constants/taskTypes";

// The full set of transitions this app will ever accept, regardless of who
// is making the change — who may invoke which edge is a separate,
// role-based decision made in task.service.ts (an assignee gets a subset
// of this graph; assigner/department-head/admin get all of it). CANCELLED
// is terminal; DONE has a reopen edge back to IN_PROGRESS; IN_REVIEW has a
// "request changes" edge back to IN_PROGRESS — both are privileged-only,
// see isPrivilegedOnlyTransition below.
const TASK_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TASK_STATUS.TODO]: [TASK_STATUS.IN_PROGRESS, TASK_STATUS.CANCELLED],
  [TASK_STATUS.IN_PROGRESS]: [TASK_STATUS.IN_REVIEW, TASK_STATUS.CANCELLED],
  [TASK_STATUS.IN_REVIEW]: [TASK_STATUS.DONE, TASK_STATUS.CANCELLED, TASK_STATUS.IN_PROGRESS],
  [TASK_STATUS.DONE]: [TASK_STATUS.IN_PROGRESS],
  [TASK_STATUS.CANCELLED]: [],
};

/** Whether `from -> to` is ever a legal task status transition. */
export function isValidTaskStatusTransition(from: TaskStatus, to: TaskStatus): boolean {
  return TASK_STATUS_TRANSITIONS[from].includes(to);
}

// Reopening a DONE task is reserved for the assigner, department head, or
// admin — an assignee driving their own task never invokes this edge.
export function isTaskReopenTransition(from: TaskStatus, to: TaskStatus): boolean {
  return from === TASK_STATUS.DONE && to === TASK_STATUS.IN_PROGRESS;
}

// A reviewer sending a task back from IN_REVIEW to IN_PROGRESS ("Request
// Changes") — same privileged-only shape as reopen: the assignee submitted
// it for review, so they don't get to un-submit it themselves via this
// edge (they could still separately move it forward again once a
// reviewer's sent it back, or the reviewer could just cancel it instead).
export function isRequestChangesTransition(from: TaskStatus, to: TaskStatus): boolean {
  return from === TASK_STATUS.IN_REVIEW && to === TASK_STATUS.IN_PROGRESS;
}

// Every edge in the graph an assignee may never invoke on their own task,
// even though the edge itself is legal for a privileged actor.
function isPrivilegedOnlyTransition(from: TaskStatus, to: TaskStatus): boolean {
  return isTaskReopenTransition(from, to) || isRequestChangesTransition(from, to);
}

/**
 * "Overdue" is never stored — always recomputed from dueDate/status against
 * the caller-supplied current date, matching this codebase's existing
 * recompute-from-source-data approach (Annual Leave accrual, dashboard
 * trends). `todayStr` is a parameter rather than read internally so this
 * stays a pure, unit-testable function.
 */
export function isTaskOverdue(
  dueDate: string | null,
  status: TaskStatus,
  todayStr: string
): boolean {
  if (!dueDate) return false;
  if (status === TASK_STATUS.DONE || status === TASK_STATUS.CANCELLED) return false;
  return dueDate < todayStr;
}

export interface TaskViewAccessInput {
  actorId: string;
  actorRole: Role;
  assignedTo: string;
  assignedBy: string;
  isDepartmentHeadOfTask: boolean;
}

/**
 * The single three/four-way visibility rule reused for task detail,
 * comments, and attachments (TDS §6/§8: "assignee, assigner, or department
 * head of the task, or admin"). Takes `isDepartmentHeadOfTask` as an
 * already-resolved boolean rather than looking it up itself, so the actual
 * decision — the highest-risk logic in this module per the architecture
 * review — is a pure, DB-free function that can be unit tested against all
 * four cases directly. task.service.ts resolves the department-head lookup
 * live (never from the display-only department cache) before calling this.
 */
export function canViewTask(input: TaskViewAccessInput): boolean {
  if (input.actorRole === ROLES.SUPER_ADMIN || input.actorRole === ROLES.ADMIN) return true;
  if (input.actorId === input.assignedTo) return true;
  if (input.actorId === input.assignedBy) return true;
  return input.isDepartmentHeadOfTask;
}

export interface TaskStatusChangeAccessInput {
  actorId: string;
  actorRole: Role;
  assignedTo: string;
  isDepartmentHeadOfTask: boolean;
  from: TaskStatus;
  to: TaskStatus;
}

/**
 * Combines "is this edge on the graph at all" with "may this actor invoke
 * it": a plain assignee gets the forward path plus cancel but never a
 * privileged-only edge (reopen, request changes); admin/department-head
 * get every edge the graph allows.
 */
export function canChangeTaskStatus(input: TaskStatusChangeAccessInput): boolean {
  if (!isValidTaskStatusTransition(input.from, input.to)) return false;

  const isPrivileged =
    input.actorRole === ROLES.SUPER_ADMIN ||
    input.actorRole === ROLES.ADMIN ||
    input.isDepartmentHeadOfTask;
  if (isPrivileged) return true;

  return (
    input.actorId === input.assignedTo && !isPrivilegedOnlyTransition(input.from, input.to)
  );
}
