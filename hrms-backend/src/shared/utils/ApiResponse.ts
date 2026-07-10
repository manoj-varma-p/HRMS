import { Response } from "express";
import { ApiSuccessBody } from "../types/api-response.types";

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = "Operation completed successfully",
  statusCode = 200
): Response<ApiSuccessBody<T>> {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}
