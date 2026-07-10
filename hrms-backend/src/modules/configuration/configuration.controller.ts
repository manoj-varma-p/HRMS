import { Request, Response } from "express";
import { sendSuccess } from "../../shared/utils/ApiResponse";
import * as configurationService from "./configuration.service";

async function get(req: Request, res: Response): Promise<void> {
  const configuration = await configurationService.getConfiguration();
  sendSuccess(res, { configuration });
}

async function updateCompanyProfile(req: Request, res: Response): Promise<void> {
  const configuration = await configurationService.updateCompanyProfile(req.user!, req.body);
  sendSuccess(res, { configuration }, "Company profile updated");
}

async function updateOfficeSettings(req: Request, res: Response): Promise<void> {
  const configuration = await configurationService.updateOfficeSettings(req.user!, req.body);
  sendSuccess(res, { configuration }, "Office settings updated");
}

async function updateLeavePolicy(req: Request, res: Response): Promise<void> {
  const configuration = await configurationService.updateLeavePolicy(req.user!, req.body);
  sendSuccess(res, { configuration }, "Leave policy updated");
}

async function updateNotificationSettings(req: Request, res: Response): Promise<void> {
  const configuration = await configurationService.updateNotificationSettings(req.user!, req.body);
  sendSuccess(res, { configuration }, "Notification settings updated");
}

async function updateEmailSettings(req: Request, res: Response): Promise<void> {
  const configuration = await configurationService.updateEmailSettings(req.user!, req.body);
  sendSuccess(res, { configuration }, "Email settings updated");
}

async function sendTestEmail(req: Request, res: Response): Promise<void> {
  const result = await configurationService.sendTestEmail(req.user!, req.body.to);
  if (result.success) {
    sendSuccess(res, result, "Test email sent");
  } else {
    sendSuccess(res, result, result.error ?? "Failed to send test email");
  }
}

async function updateSecuritySettings(req: Request, res: Response): Promise<void> {
  const configuration = await configurationService.updateSecuritySettings(req.user!, req.body);
  sendSuccess(res, { configuration }, "Security settings updated");
}

async function updateGeneralSettings(req: Request, res: Response): Promise<void> {
  const configuration = await configurationService.updateGeneralSettings(req.user!, req.body);
  sendSuccess(res, { configuration }, "General settings updated");
}

export {
  get,
  updateCompanyProfile,
  updateOfficeSettings,
  updateLeavePolicy,
  updateNotificationSettings,
  updateEmailSettings,
  sendTestEmail,
  updateSecuritySettings,
  updateGeneralSettings,
};
