import { Request, Response } from "express";
import { ApiError } from "../../shared/errors/ApiError";
import { sendSuccess } from "../../shared/utils/ApiResponse";
import { DocumentCategory } from "./document.model";
import * as documentService from "./document.service";

async function upload(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    throw new ApiError(422, "Upload a PDF, JPEG, PNG, or DOCX file under 10MB");
  }
  const employeeId = String(req.params.employeeId);
  const category = req.body.category as DocumentCategory;
  const document = await documentService.uploadDocument(req.user!, employeeId, category, req.file);
  sendSuccess(res, { document }, "Document uploaded", 201);
}

async function list(req: Request, res: Response): Promise<void> {
  const employeeId = String(req.params.employeeId);
  const { includeDeleted } = req.validated!.query as { includeDeleted: boolean };
  const documents = await documentService.listEmployeeDocuments(req.user!, employeeId, includeDeleted);
  sendSuccess(res, { documents });
}

async function getDownloadUrl(req: Request, res: Response): Promise<void> {
  const documentId = String(req.params.documentId);
  const url = await documentService.getDownloadUrl(req.user!, documentId);
  sendSuccess(res, { url });
}

async function remove(req: Request, res: Response): Promise<void> {
  const documentId = String(req.params.documentId);
  const document = await documentService.softDeleteDocument(req.user!, documentId);
  sendSuccess(res, { document }, "Document deleted");
}

async function restore(req: Request, res: Response): Promise<void> {
  const documentId = String(req.params.documentId);
  const document = await documentService.restoreDocument(req.user!, documentId);
  sendSuccess(res, { document }, "Document restored");
}

async function approve(req: Request, res: Response): Promise<void> {
  const documentId = String(req.params.documentId);
  const document = await documentService.approveDocument(req.user!, documentId, req.body.comment);
  sendSuccess(res, { document }, "Document approved");
}

async function reject(req: Request, res: Response): Promise<void> {
  const documentId = String(req.params.documentId);
  const document = await documentService.rejectDocument(req.user!, documentId, req.body.comment);
  sendSuccess(res, { document }, "Document rejected");
}

export { upload, list, getDownloadUrl, remove, restore, approve, reject };
