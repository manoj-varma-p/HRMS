import { Request, Response } from "express";
import { sendSuccess } from "../../shared/utils/ApiResponse";
import * as holidayService from "./holiday.service";

async function list(req: Request, res: Response): Promise<void> {
  const { includeInactive, year } = req.validated!.query as {
    includeInactive: boolean;
    year?: number;
  };
  const holidays = await holidayService.listHolidays(includeInactive, year);
  sendSuccess(res, { holidays });
}

async function create(req: Request, res: Response): Promise<void> {
  const holiday = await holidayService.createHoliday(req.user!, req.body);
  sendSuccess(res, { holiday }, "Holiday created", 201);
}

async function update(req: Request, res: Response): Promise<void> {
  const holiday = await holidayService.updateHoliday(
    req.user!,
    String(req.params.id),
    req.body
  );
  sendSuccess(res, { holiday }, "Holiday updated");
}

async function activate(req: Request, res: Response): Promise<void> {
  const holiday = await holidayService.setHolidayActive(
    req.user!,
    String(req.params.id),
    true
  );
  sendSuccess(res, { holiday }, "Holiday activated");
}

async function deactivate(req: Request, res: Response): Promise<void> {
  const holiday = await holidayService.setHolidayActive(
    req.user!,
    String(req.params.id),
    false
  );
  sendSuccess(res, { holiday }, "Holiday deactivated");
}

export { list, create, update, activate, deactivate };
