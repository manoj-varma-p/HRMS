import { Request, Response } from "express";
import { sendSuccess } from "../../shared/utils/ApiResponse";
import * as adobeLicenseService from "./adobe-license.service";

async function getSheet(req: Request, res: Response): Promise<void> {
  const sheet = await adobeLicenseService.getSheet(req.user!);
  sendSuccess(res, { sheet });
}

async function updateSheet(req: Request, res: Response): Promise<void> {
  const sheet = await adobeLicenseService.updateSheet(req.user!, req.body);
  sendSuccess(res, { sheet }, "Sheet updated");
}

async function myAccess(req: Request, res: Response): Promise<void> {
  const result = await adobeLicenseService.checkMyAccess(req.user!);
  sendSuccess(res, result);
}

async function listAccess(_req: Request, res: Response): Promise<void> {
  const users = await adobeLicenseService.listAccess();
  sendSuccess(res, { users });
}

async function grantAccess(req: Request, res: Response): Promise<void> {
  const users = await adobeLicenseService.grantAccess(
    req.user!,
    String(req.params.userId),
    req.body.permission
  );
  sendSuccess(res, { users }, "Access granted");
}

async function revokeAccess(req: Request, res: Response): Promise<void> {
  const users = await adobeLicenseService.revokeAccess(req.user!, String(req.params.userId));
  sendSuccess(res, { users }, "Access revoked");
}

export { getSheet, updateSheet, myAccess, listAccess, grantAccess, revokeAccess };
