import crypto from "node:crypto";
import { ApiError } from "../../shared/errors/ApiError";
import { ROLES } from "../../shared/constants/roles";
import { ACTIVITY_ACTIONS } from "../../shared/constants/activityActions";
import { NOTIFICATION_TYPES } from "../../shared/constants/notificationTypes";
import { toId } from "../../shared/utils/toId";
import { recordActivity } from "../activity-log/activity-log.service";
import { notifyAdmins, notifyUser } from "../notifications/notifications.service";
import { uploadObject, deleteObject, getSignedDownloadUrl } from "../../shared/services/s3.client";
import { UserModel } from "../user/user.model";
import {
  EmployeeDocumentModel,
  IEmployeeDocument,
  DocumentCategory,
  DOCUMENT_STATUS,
  DOCUMENT_REVIEW_STATUS,
} from "./document.model";

interface Actor {
  id: string;
  role: string;
  employeeId: string;
}

// Both the employee who owns the documents and any admin/super admin may
// manage them — nobody else. Centralized here so every action below
// (upload/list/download/delete/restore) enforces the exact same rule.
function assertCanManage(actor: Actor, employeeId: string): void {
  const isSelf = actor.id === employeeId;
  const isAdmin = actor.role === ROLES.ADMIN || actor.role === ROLES.SUPER_ADMIN;
  if (!isSelf && !isAdmin) {
    throw new ApiError(403, "You can only manage your own documents");
  }
}

function toPublicDocument(doc: IEmployeeDocument) {
  return {
    id: toId(doc),
    employee: doc.employee,
    category: doc.category,
    originalFileName: doc.originalFileName,
    mimeType: doc.mimeType,
    fileSizeBytes: doc.fileSizeBytes,
    status: doc.status,
    uploadedBy: doc.uploadedBy,
    deletedAt: doc.deletedAt,
    reviewStatus: doc.reviewStatus,
    reviewedBy: doc.reviewedBy,
    reviewedAt: doc.reviewedAt,
    reviewComment: doc.reviewComment,
    createdAt: doc.createdAt,
  };
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-100);
}

function buildS3Key(employeeCode: string, category: DocumentCategory, fileName: string): string {
  const unique = crypto.randomUUID();
  return `employees/${employeeCode}/documents/${category.toLowerCase()}/${unique}-${sanitizeFileName(fileName)}`;
}

export async function uploadDocument(
  actor: Actor,
  employeeId: string,
  category: DocumentCategory,
  file: Express.Multer.File
) {
  assertCanManage(actor, employeeId);

  const employee = await UserModel.findById(employeeId).select("employeeId fullName");
  if (!employee) throw new ApiError(404, "Employee not found");

  const s3Key = buildS3Key(employee.employeeId, category, file.originalname);
  await uploadObject(s3Key, file.buffer, file.mimetype);

  // A document an admin uploads on someone else's behalf is auto-approved
  // — the admin doing the upload IS the review. Only an employee's own
  // self-upload needs a separate admin sign-off afterward.
  const isSelfUpload = actor.id === employeeId;

  const doc = await EmployeeDocumentModel.create({
    employee: employeeId,
    category,
    originalFileName: file.originalname,
    s3Key,
    mimeType: file.mimetype,
    fileSizeBytes: file.size,
    uploadedBy: actor.id,
    reviewStatus: isSelfUpload ? DOCUMENT_REVIEW_STATUS.PENDING : DOCUMENT_REVIEW_STATUS.APPROVED,
    reviewedBy: isSelfUpload ? null : actor.id,
    reviewedAt: isSelfUpload ? null : new Date(),
  });

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.DOCUMENT_UPLOADED,
    targetType: "EmployeeDocument",
    targetId: toId(doc),
    metadata: { employeeId, category, fileName: file.originalname },
  });

  // Best-effort, in-app only (no email template for this event) — lets
  // admins notice self-uploaded documents without watching every profile.
  if (isSelfUpload) {
    await notifyAdmins(actor.id, {
      type: NOTIFICATION_TYPES.DOCUMENT_UPLOADED,
      title: "Document awaiting approval",
      message: `${employee.fullName} (${employee.employeeId}) uploaded a ${category.toLowerCase()} document for review`,
      metadata: { employeeId, documentId: toId(doc) },
    });
  }

  return toPublicDocument(doc);
}

export async function listEmployeeDocuments(
  actor: Actor,
  employeeId: string,
  includeDeleted: boolean
) {
  assertCanManage(actor, employeeId);

  const filter: Record<string, unknown> = { employee: employeeId };
  if (!includeDeleted) filter.status = DOCUMENT_STATUS.ACTIVE;

  const docs = await EmployeeDocumentModel.find(filter).sort({ createdAt: -1 });
  return docs.map(toPublicDocument);
}

async function getOwnedDocument(actor: Actor, documentId: string): Promise<IEmployeeDocument> {
  const doc = await EmployeeDocumentModel.findById(documentId);
  if (!doc) throw new ApiError(404, "Document not found");
  assertCanManage(actor, String(doc.employee));
  return doc;
}

export async function getDownloadUrl(actor: Actor, documentId: string): Promise<string> {
  const doc = await getOwnedDocument(actor, documentId);
  if (doc.status !== DOCUMENT_STATUS.ACTIVE) {
    throw new ApiError(409, "This document has been deleted");
  }
  return getSignedDownloadUrl(doc.s3Key);
}

function assertIsReviewer(actor: Actor): void {
  if (actor.role !== ROLES.ADMIN && actor.role !== ROLES.SUPER_ADMIN) {
    throw new ApiError(403, "Only an admin can review documents");
  }
}

async function getPendingDocumentForReview(
  actor: Actor,
  documentId: string
): Promise<IEmployeeDocument> {
  assertIsReviewer(actor);
  const doc = await EmployeeDocumentModel.findById(documentId);
  if (!doc) throw new ApiError(404, "Document not found");
  if (doc.status !== DOCUMENT_STATUS.ACTIVE) {
    throw new ApiError(409, "This document has been deleted");
  }
  if (doc.reviewStatus !== DOCUMENT_REVIEW_STATUS.PENDING) {
    throw new ApiError(409, "This document has already been reviewed");
  }
  return doc;
}

export async function approveDocument(actor: Actor, documentId: string, comment?: string) {
  const doc = await getPendingDocumentForReview(actor, documentId);

  doc.reviewStatus = DOCUMENT_REVIEW_STATUS.APPROVED;
  doc.reviewedBy = actor.id as never;
  doc.reviewedAt = new Date();
  doc.reviewComment = comment ?? null;
  await doc.save();

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.DOCUMENT_APPROVED,
    targetType: "EmployeeDocument",
    targetId: toId(doc),
    metadata: { employeeId: String(doc.employee) },
  });

  await notifyUser({
    user: String(doc.employee),
    type: NOTIFICATION_TYPES.DOCUMENT_APPROVED,
    title: "Document approved",
    message: `Your ${doc.category.toLowerCase()} document "${doc.originalFileName}" was approved`,
    metadata: { documentId: toId(doc) },
  });

  return toPublicDocument(doc);
}

export async function rejectDocument(actor: Actor, documentId: string, comment?: string) {
  const doc = await getPendingDocumentForReview(actor, documentId);

  doc.reviewStatus = DOCUMENT_REVIEW_STATUS.REJECTED;
  doc.reviewedBy = actor.id as never;
  doc.reviewedAt = new Date();
  doc.reviewComment = comment ?? null;
  await doc.save();

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.DOCUMENT_REJECTED,
    targetType: "EmployeeDocument",
    targetId: toId(doc),
    metadata: { employeeId: String(doc.employee), comment },
  });

  await notifyUser({
    user: String(doc.employee),
    type: NOTIFICATION_TYPES.DOCUMENT_REJECTED,
    title: "Document rejected",
    message: comment
      ? `Your ${doc.category.toLowerCase()} document "${doc.originalFileName}" was rejected: ${comment}`
      : `Your ${doc.category.toLowerCase()} document "${doc.originalFileName}" was rejected`,
    metadata: { documentId: toId(doc) },
  });

  return toPublicDocument(doc);
}

export async function softDeleteDocument(actor: Actor, documentId: string) {
  const doc = await getOwnedDocument(actor, documentId);
  if (doc.status === DOCUMENT_STATUS.DELETED) {
    throw new ApiError(409, "This document is already deleted");
  }

  doc.status = DOCUMENT_STATUS.DELETED;
  doc.deletedBy = actor.id as never;
  doc.deletedAt = new Date();
  await doc.save();

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.DOCUMENT_DELETED,
    targetType: "EmployeeDocument",
    targetId: toId(doc),
    metadata: { employeeId: String(doc.employee) },
  });

  return toPublicDocument(doc);
}

export async function restoreDocument(actor: Actor, documentId: string) {
  const doc = await getOwnedDocument(actor, documentId);
  if (doc.status !== DOCUMENT_STATUS.DELETED) {
    throw new ApiError(409, "This document isn't deleted");
  }

  doc.status = DOCUMENT_STATUS.ACTIVE;
  doc.deletedBy = null;
  doc.deletedAt = null;
  await doc.save();

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.DOCUMENT_RESTORED,
    targetType: "EmployeeDocument",
    targetId: toId(doc),
    metadata: { employeeId: String(doc.employee) },
  });

  return toPublicDocument(doc);
}

// Permanent — only ever called by deleteEmployee's cascade (employee.service.ts),
// never exposed via a route. A soft-deleted-then-restorable document only
// makes sense while the employee record still exists.
export async function purgeAllDocumentsForEmployee(employeeId: string): Promise<void> {
  const docs = await EmployeeDocumentModel.find({ employee: employeeId }).select("s3Key");
  await Promise.all(docs.map((d) => deleteObject(d.s3Key)));
  await EmployeeDocumentModel.deleteMany({ employee: employeeId });
}
