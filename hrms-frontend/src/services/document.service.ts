import { apiFetch, apiUpload } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { EmployeeDocument, DocumentCategory } from "@/types/document.types";

type ApiSuccess<T> = { success: true; message: string; data: T };

export function listDocuments(employeeId: string, includeDeleted = false) {
  const qs = includeDeleted ? "?includeDeleted=true" : "";
  return apiFetch<ApiSuccess<{ documents: EmployeeDocument[] }>>(
    `${API_ENDPOINTS.DOCUMENTS.LIST(employeeId)}${qs}`
  ).then((res) => res.data.documents);
}

export function uploadDocument(
  employeeId: string,
  category: DocumentCategory,
  file: File,
  onProgress?: (percent: number) => void
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("category", category);
  return apiUpload<ApiSuccess<{ document: EmployeeDocument }>>(
    API_ENDPOINTS.DOCUMENTS.UPLOAD(employeeId),
    formData,
    onProgress
  ).then((res) => res.data.document);
}

export function getDownloadUrl(documentId: string) {
  return apiFetch<ApiSuccess<{ url: string }>>(
    API_ENDPOINTS.DOCUMENTS.DOWNLOAD_URL(documentId)
  ).then((res) => res.data.url);
}

export function deleteDocument(documentId: string) {
  return apiFetch<ApiSuccess<{ document: EmployeeDocument }>>(
    API_ENDPOINTS.DOCUMENTS.DELETE(documentId),
    { method: "DELETE" }
  ).then((res) => res.data.document);
}

export function restoreDocument(documentId: string) {
  return apiFetch<ApiSuccess<{ document: EmployeeDocument }>>(
    API_ENDPOINTS.DOCUMENTS.RESTORE(documentId),
    { method: "PATCH" }
  ).then((res) => res.data.document);
}

export function approveDocument(documentId: string, comment?: string) {
  return apiFetch<ApiSuccess<{ document: EmployeeDocument }>>(
    API_ENDPOINTS.DOCUMENTS.APPROVE(documentId),
    { method: "PATCH", body: JSON.stringify({ comment }) }
  ).then((res) => res.data.document);
}

export function rejectDocument(documentId: string, comment?: string) {
  return apiFetch<ApiSuccess<{ document: EmployeeDocument }>>(
    API_ENDPOINTS.DOCUMENTS.REJECT(documentId),
    { method: "PATCH", body: JSON.stringify({ comment }) }
  ).then((res) => res.data.document);
}
