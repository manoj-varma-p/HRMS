import { Request, Response } from "express";
import { sendSuccess } from "../../shared/utils/ApiResponse";
import * as correctionService from "./attendance-correction.service";

async function create(req: Request, res: Response): Promise<void> {
  const correction = await correctionService.requestCorrection(req.user!, req.body);
  sendSuccess(res, { correction }, "Correction request submitted", 201);
}

async function mine(req: Request, res: Response): Promise<void> {
  const query = req.validated!.query as { page: number; limit: number; status?: never };
  const result = await correctionService.listMyCorrections(req.user!.id, query);
  sendSuccess(res, result);
}

async function adminList(req: Request, res: Response): Promise<void> {
  const query = req.validated!.query as { page: number; limit: number; status?: never };
  const result = await correctionService.adminListCorrections(query);
  sendSuccess(res, result);
}

async function approve(req: Request, res: Response): Promise<void> {
  const correction = await correctionService.approveCorrection(
    req.user!,
    String(req.params.id),
    req.body.comment
  );
  sendSuccess(res, { correction }, "Correction approved");
}

async function reject(req: Request, res: Response): Promise<void> {
  const correction = await correctionService.rejectCorrection(
    req.user!,
    String(req.params.id),
    req.body.comment
  );
  sendSuccess(res, { correction }, "Correction rejected");
}

export { create, mine, adminList, approve, reject };
