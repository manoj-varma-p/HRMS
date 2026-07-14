import { TaskPriority, TaskStatus } from "@/types/task.types";

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
  DONE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent",
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
// on the backend, minus the DONE -> IN_PROGRESS reopen edge, which is
// reserved for the assigner/department-head/admin (out of scope for
// Phase 2's employee-only UI). Keeping this in sync with the backend's
// transition table is what lets the status selector only ever offer moves
// the API will actually accept.
export const TASK_EMPLOYEE_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  TODO: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["IN_REVIEW", "CANCELLED"],
  IN_REVIEW: ["DONE", "CANCELLED"],
  DONE: [],
  CANCELLED: [],
};
