import { TaskPriority, TaskStatus } from "@/types/task.types";

// Shared by every task list/detail/comment query so views pick up changes
// made by someone else (a new task, a status change, a comment) without a
// manual refresh — only while the tab is actually focused (unlike the
// notification-toast poll, there's no value refreshing a view nobody is
// looking at, and the toast system already covers "something happened
// while I was away").
export const TASK_POLL_INTERVAL_MS = 20_000;

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
  CANCELLED: "Cancelled",
};

export const TASK_STATUS_BADGE: Record<TaskStatus, string> = {
  TODO: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-transparent",
  IN_PROGRESS: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-transparent",
  IN_REVIEW: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-transparent",
  // Solid fill rather than the light/subtle treatment every other status
  // uses — a completed task is the one state worth making visually pop
  // out at a glance in a list or table full of badges.
  DONE: "bg-emerald-600 text-white border-transparent dark:bg-emerald-500",
  CANCELLED: "bg-muted text-muted-foreground border-transparent",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const TASK_PRIORITY_BADGE: Record<TaskPriority, string> = {
  LOW: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-transparent",
  MEDIUM: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-transparent",
  HIGH: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-transparent",
  URGENT: "bg-red-500/10 text-red-600 dark:text-red-400 border-transparent",
};

// The subset of transitions a plain assignee may invoke on their own task
// (forward path + cancel) — mirrors task.util.ts's TASK_STATUS_TRANSITIONS
// on the backend, minus the two privileged-only edges (DONE -> IN_PROGRESS
// reopen, IN_REVIEW -> IN_PROGRESS request-changes), both reserved for the
// assigner/department-head/admin. Keeping this in sync with the backend's
// transition table is what lets the status selector only ever offer moves
// the API will actually accept.
export const TASK_EMPLOYEE_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  TODO: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["IN_REVIEW", "CANCELLED"],
  IN_REVIEW: ["DONE", "CANCELLED"],
  DONE: [],
  CANCELLED: [],
};

// The FULL graph — every edge task.util.ts's TASK_STATUS_TRANSITIONS
// allows, including the two privileged-only edges above. Used by
// TaskStatusSelector when the viewer is the assigner, department head, or
// admin (never the assignee, who only ever sees the subset above).
export const TASK_PRIVILEGED_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  TODO: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["IN_REVIEW", "CANCELLED"],
  IN_REVIEW: ["DONE", "CANCELLED", "IN_PROGRESS"],
  DONE: ["IN_PROGRESS"],
  CANCELLED: [],
};
