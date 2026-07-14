import { apiFetch, apiUpload } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";
import {
  PaginationInfo,
  Task,
  TaskAttachment,
  TaskComment,
  TaskPriority,
  TaskStatus,
} from "@/types/task.types";

type ApiSuccess<T> = { success: true; message: string; data: T };

function toQueryString(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export interface MyTasksParams {
  page?: number;
  limit?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
}

export function myTasks(params: MyTasksParams) {
  return apiFetch<ApiSuccess<{ tasks: Task[]; pagination: PaginationInfo }>>(
    `${API_ENDPOINTS.TASKS.MINE}${toQueryString({ ...params })}`
  );
}

export function getTask(taskId: string) {
  return apiFetch<ApiSuccess<{ task: Task }>>(API_ENDPOINTS.TASKS.DETAIL(taskId)).then(
    (res) => res.data.task
  );
}

export function changeTaskStatus(taskId: string, status: TaskStatus) {
  return apiFetch<ApiSuccess<{ task: Task }>>(API_ENDPOINTS.TASKS.STATUS(taskId), {
    method: "PATCH",
    body: JSON.stringify({ status }),
  }).then((res) => res.data.task);
}

export interface ListCommentsParams {
  page?: number;
  limit?: number;
}

export function listComments(taskId: string, params: ListCommentsParams = {}) {
  return apiFetch<ApiSuccess<{ comments: TaskComment[]; pagination: PaginationInfo }>>(
    `${API_ENDPOINTS.TASKS.COMMENTS(taskId)}${toQueryString({ ...params })}`
  );
}

export function addComment(taskId: string, body: string) {
  return apiFetch<ApiSuccess<{ comment: TaskComment }>>(API_ENDPOINTS.TASKS.COMMENTS(taskId), {
    method: "POST",
    body: JSON.stringify({ body }),
  }).then((res) => res.data.comment);
}

export function listAttachments(taskId: string) {
  return apiFetch<ApiSuccess<{ attachments: TaskAttachment[] }>>(
    API_ENDPOINTS.TASKS.ATTACHMENTS(taskId)
  ).then((res) => res.data.attachments);
}

export function uploadAttachment(
  taskId: string,
  file: File,
  onProgress?: (percent: number) => void
) {
  const formData = new FormData();
  formData.append("file", file);
  return apiUpload<ApiSuccess<{ attachment: TaskAttachment }>>(
    API_ENDPOINTS.TASKS.ATTACHMENTS(taskId),
    formData,
    onProgress
  ).then((res) => res.data.attachment);
}

export function getAttachmentDownloadUrl(attachmentId: string) {
  return apiFetch<ApiSuccess<{ url: string }>>(
    API_ENDPOINTS.TASKS.ATTACHMENT_DOWNLOAD_URL(attachmentId)
  ).then((res) => res.data.url);
}
