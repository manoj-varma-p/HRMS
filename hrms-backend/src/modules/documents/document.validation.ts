import { z } from "zod";
import { DOCUMENT_CATEGORY } from "./document.model";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const documentIdParamSchema = z.object({
  params: z.object({ documentId: objectId }),
});

export const reviewDocumentSchema = z.object({
  params: z.object({ documentId: objectId }),
  body: z.object({
    comment: z.string().trim().max(500).optional(),
  }),
});

export const listDocumentsSchema = z.object({
  params: z.object({ employeeId: objectId }),
  query: z.object({
    includeDeleted: z.coerce.boolean().optional().default(false),
  }),
});

export const uploadDocumentSchema = z.object({
  params: z.object({ employeeId: objectId }),
  body: z.object({
    category: z.enum(Object.values(DOCUMENT_CATEGORY) as [string, ...string[]]),
  }),
});
