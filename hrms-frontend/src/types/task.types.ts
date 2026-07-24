export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "CANCELLED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface TaskUserRef {
  _id: string;
  fullName: string;
  employeeId: string;
}

export interface TaskDepartmentRef {
  _id: string;
  name: string;
}

export interface Task {
  id: string;
  taskId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignedBy: TaskUserRef | null;
  assignedTo: TaskUserRef | null;
  department: TaskDepartmentRef | null;
  parentTask: string | null;
  dueDate: string | null;
  overdue: boolean;
  completedAt: string | null;
  /** How many times a reviewer has sent this task back from IN_REVIEW for changes. */
  revisionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskComment {
  id: string;
  task: string;
  author: TaskUserRef;
  body: string;
  createdAt: string;
}

export type TaskAttachmentStatus = "ACTIVE" | "DELETED";

export interface TaskAttachment {
  id: string;
  task: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  status: TaskAttachmentStatus;
  uploadedBy: string;
  deletedAt: string | null;
  createdAt: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
