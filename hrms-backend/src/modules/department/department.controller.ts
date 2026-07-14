import { Request, Response } from "express";
import { sendSuccess } from "../../shared/utils/ApiResponse";
import * as departmentService from "./department.service";

async function list(req: Request, res: Response): Promise<void> {
  const { includeInactive } = req.validated!.query as { includeInactive: boolean };
  const departments = await departmentService.listDepartments(includeInactive);
  sendSuccess(res, { departments });
}

async function create(req: Request, res: Response): Promise<void> {
  const department = await departmentService.createDepartment(
    req.user!,
    req.body.name
  );
  sendSuccess(res, { department }, "Department created", 201);
}

async function update(req: Request, res: Response): Promise<void> {
  const department = await departmentService.updateDepartment(
    req.user!,
    String(req.params.id),
    req.body.name
  );
  sendSuccess(res, { department }, "Department updated");
}

async function activate(req: Request, res: Response): Promise<void> {
  const department = await departmentService.setDepartmentActive(
    req.user!,
    String(req.params.id),
    true
  );
  sendSuccess(res, { department }, "Department activated");
}

async function deactivate(req: Request, res: Response): Promise<void> {
  const department = await departmentService.setDepartmentActive(
    req.user!,
    String(req.params.id),
    false
  );
  sendSuccess(res, { department }, "Department deactivated");
}

async function setHead(req: Request, res: Response): Promise<void> {
  const department = await departmentService.setDepartmentHead(
    req.user!,
    String(req.params.id),
    req.body.headEmployeeId
  );
  sendSuccess(res, { department }, "Department head updated");
}

export { list, create, update, activate, deactivate, setHead };
