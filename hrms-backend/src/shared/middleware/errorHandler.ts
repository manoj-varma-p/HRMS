import { NextFunction, Request, Response } from "express";
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

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isApiError = err instanceof ApiError;
  const statusCode = isApiError ? err.statusCode : 500;
  const message = isApiError ? err.message : "Internal server error";

  if (!isApiError) {
    logger.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: isApiError ? err.errors : [],
    ...(!isProduction && !isApiError && err instanceof Error
      ? { stack: err.stack }
      : {}),
  });
}
