import { Request, Response } from "express";
import { sendSuccess } from "../../shared/utils/ApiResponse";
import * as leaveService from "./leave.service";

async function apply(req: Request, res: Response): Promise<void> {
  const leave = await leaveService.applyLeave(req.user!, req.body);
  sendSuccess(res, { leave }, "Leave request submitted", 201);
}

async function mine(req: Request, res: Response): Promise<void> {
  const query = req.validated!.query as Parameters<typeof leaveService.listMyLeaves>[1];
  const result = await leaveService.listMyLeaves(req.user!.id, query);
  sendSuccess(res, result);
}

async function adminList(req: Request, res: Response): Promise<void> {
  const query = req.validated!.query as Parameters<typeof leaveService.adminListLeaves>[0];
  const result = await leaveService.adminListLeaves(query);
  sendSuccess(res, result);
}

async function balance(req: Request, res: Response): Promise<void> {
  const query = req.validated!.query as { employeeId?: string; year?: number };
  const employeeId = await leaveService.resolveViewableEmployeeId(
    req.user!,
    query.employeeId
  );
  const year = query.year ?? new Date().getFullYear();
  const data = await leaveService.getLeaveBalance(employeeId, year);
  sendSuccess(res, data);
}

async function cancel(req: Request, res: Response): Promise<void> {
  const leave = await leaveService.cancelLeave(req.user!, String(req.params.id));
  sendSuccess(res, { leave }, "Leave request cancelled");
}

async function approve(req: Request, res: Response): Promise<void> {
  const leave = await leaveService.approveLeave(
    req.user!,
    String(req.params.id),
    req.body.comment
  );
  sendSuccess(res, { leave }, "Leave approved");
}

async function reject(req: Request, res: Response): Promise<void> {
  const leave = await leaveService.rejectLeave(
    req.user!,
    String(req.params.id),
    req.body.comment
  );
  sendSuccess(res, { leave }, "Leave rejected");
}

async function grantExtra(req: Request, res: Response): Promise<void> {
  const allocation = await leaveService.grantExtraLeave(req.user!, req.body);
  sendSuccess(res, { allocation }, "Extra leave granted successfully", 201);
}

async function listAllocations(req: Request, res: Response): Promise<void> {
  const query = req.query as { employeeId?: string; year?: string };
  const allocations = await leaveService.listLeaveAllocations({
    employeeId: query.employeeId,
    year: query.year ? Number(query.year) : undefined,
  });
  sendSuccess(res, { allocations });
}

async function updateAllocation(req: Request, res: Response): Promise<void> {
  const allocation = await leaveService.updateLeaveAllocation(
    req.user!,
    String(req.params.id),
    req.body
  );
  sendSuccess(res, { allocation }, "Leave allocation updated successfully");
}

async function deleteAllocation(req: Request, res: Response): Promise<void> {
  const result = await leaveService.deleteLeaveAllocation(
    req.user!,
    String(req.params.id)
  );
  sendSuccess(res, result, "Leave allocation deleted successfully");
}

export {
  apply,
  mine,
  adminList,
  balance,
  cancel,
  approve,
  reject,
  grantExtra,
  listAllocations,
  updateAllocation,
  deleteAllocation,
};
