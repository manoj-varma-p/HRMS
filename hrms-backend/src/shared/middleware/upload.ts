import multer from "multer";

// Memory storage everywhere — files are small, live only as long as the
// request takes to hand them to S3, and never touch local disk (no temp
// file cleanup to get wrong, nothing left behind if a request is aborted).
const storage = multer.memoryStorage();

const LOGO_MAX_BYTES = 2 * 1024 * 1024; // 2MB
const LOGO_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/svg+xml", "image/webp"]);

export const uploadLogo = multer({
  storage,
  limits: { fileSize: LOGO_MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    cb(null, LOGO_MIME_TYPES.has(file.mimetype));
  },
}).single("logo");

export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024; // 10MB
const DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const uploadDocument = multer({
  storage,
  limits: { fileSize: DOCUMENT_MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    cb(null, DOCUMENT_MIME_TYPES.has(file.mimetype));
  },
}).single("file");
