import { Request, Response } from "express";
import { sendSuccess } from "../../shared/utils/ApiResponse";
import * as dashboardService from "./dashboard.service";

async function admin(_req: Request, res: Response): Promise<void> {
  const data = await dashboardService.getAdminDashboard();
  sendSuccess(res, data);
}

export { admin };
