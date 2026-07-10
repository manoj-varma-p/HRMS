import { Request, Response } from "express";
import { sendSuccess } from "../../shared/utils/ApiResponse";

export function getHealth(_req: Request, res: Response): void {
  sendSuccess(
    res,
    { timestamp: new Date().toISOString() },
    "HRMS API is healthy"
  );
}
