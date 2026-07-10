import { Request, Response } from "express";
import { sendSuccess } from "../../shared/utils/ApiResponse";
import * as activityLogService from "./activity-log.service";

async function list(req: Request, res: Response): Promise<void> {
  const query = req.validated!.query as Parameters<typeof activityLogService.listActivity>[0];
  const result = await activityLogService.listActivity(query);
  sendSuccess(res, result);
}

export { list };
