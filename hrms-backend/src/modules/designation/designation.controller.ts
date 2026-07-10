import { Request, Response } from "express";
import { sendSuccess } from "../../shared/utils/ApiResponse";
import * as designationService from "./designation.service";

async function list(req: Request, res: Response): Promise<void> {
  const { includeInactive } = req.validated!.query as { includeInactive: boolean };
  const designations = await designationService.listDesignations(includeInactive);
  sendSuccess(res, { designations });
}

async function create(req: Request, res: Response): Promise<void> {
  const designation = await designationService.createDesignation(
    req.user!,
    req.body.name
  );
  sendSuccess(res, { designation }, "Designation created", 201);
}

async function update(req: Request, res: Response): Promise<void> {
  const designation = await designationService.updateDesignation(
    req.user!,
    String(req.params.id),
    req.body.name
  );
  sendSuccess(res, { designation }, "Designation updated");
}

async function activate(req: Request, res: Response): Promise<void> {
  const designation = await designationService.setDesignationActive(
    req.user!,
    String(req.params.id),
    true
  );
  sendSuccess(res, { designation }, "Designation activated");
}

async function deactivate(req: Request, res: Response): Promise<void> {
  const designation = await designationService.setDesignationActive(
    req.user!,
    String(req.params.id),
    false
  );
  sendSuccess(res, { designation }, "Designation deactivated");
}

export { list, create, update, activate, deactivate };
