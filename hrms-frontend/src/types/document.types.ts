export type DocumentCategory = "IDENTITY" | "EDUCATION" | "EMPLOYMENT" | "FINANCE" | "OTHER";
export type EmployeeDocumentStatus = "ACTIVE" | "DELETED";
export type DocumentReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface EmployeeDocument {
  id: string;
  employee: string;
  category: DocumentCategory;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  status: EmployeeDocumentStatus;
  uploadedBy: string;
  deletedAt: string | null;
  reviewStatus: DocumentReviewStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewComment: string | null;
  createdAt: string;
}
