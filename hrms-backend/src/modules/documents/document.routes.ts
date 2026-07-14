import { Router } from "express";
import { authenticate } from "../../shared/middleware/authenticate";
import { authorize } from "../../shared/middleware/authorize";
import { validate } from "../../shared/middleware/validate";
import { ROLES } from "../../shared/constants/roles";
import { uploadDocument as uploadDocumentMiddleware } from "../../shared/middleware/upload";
import {
  documentIdParamSchema,
  listDocumentsSchema,
  reviewDocumentSchema,
  uploadDocumentSchema,
} from "./document.validation";
import * as documentController from "./document.controller";

// No blanket role gate here — unlike most admin-managed resources,
// employees manage their own documents too. Every action instead checks
// "is this the owner, or an admin" inside document.service.ts, per document
// (via the resource's own employee field), not per route.
const router = Router();
const manage = authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN);

router.use(authenticate);

router.post(
  "/employees/:employeeId/documents",
  uploadDocumentMiddleware,
  validate(uploadDocumentSchema),
  documentController.upload
);
router.get(
  "/employees/:employeeId/documents",
  validate(listDocumentsSchema),
  documentController.list
);
router.get(
  "/documents/:documentId/download-url",
  validate(documentIdParamSchema),
  documentController.getDownloadUrl
);
router.delete(
  "/documents/:documentId",
  validate(documentIdParamSchema),
  documentController.remove
);
router.patch(
  "/documents/:documentId/restore",
  validate(documentIdParamSchema),
  documentController.restore
);
router.patch(
  "/documents/:documentId/approve",
  manage,
  validate(reviewDocumentSchema),
  documentController.approve
);
router.patch(
  "/documents/:documentId/reject",
  manage,
  validate(reviewDocumentSchema),
  documentController.reject
);

export default router;
