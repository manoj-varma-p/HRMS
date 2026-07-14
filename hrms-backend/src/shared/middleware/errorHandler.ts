import { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { ApiError } from "../errors/ApiError";
import { isProduction } from "../config/env";
import { logger } from "../utils/logger";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    errors: [],
  });
}

// Upload middleware reports things like "file too large" via MulterError,
// not ApiError — normalized here rather than in every route that accepts
// an upload. (A rejected file type doesn't throw at all — multer's
// fileFilter just leaves req.file undefined — so that case is checked
// explicitly in each upload controller instead.)
function toApiError(err: unknown): ApiError | null {
  if (!(err instanceof MulterError)) return null;
  if (err.code === "LIMIT_FILE_SIZE") {
    return new ApiError(413, "File is too large");
  }
  return new ApiError(400, err.message);
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const normalized = toApiError(err) ?? err;
  const isApiError = normalized instanceof ApiError;
  const statusCode = isApiError ? normalized.statusCode : 500;
  const message = isApiError ? normalized.message : "Internal server error";

  if (!isApiError) {
    logger.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: isApiError ? normalized.errors : [],
    ...(!isProduction && !isApiError && err instanceof Error
      ? { stack: err.stack }
      : {}),
  });
}
