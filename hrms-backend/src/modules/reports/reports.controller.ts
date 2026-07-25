import { Request, Response } from "express";
import { sendSuccess } from "../../shared/utils/ApiResponse";
import * as reportsService from "./reports.service";

function currentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

async function attendanceReport(req: Request, res: Response): Promise<void> {
  const query = req.validated!.query as Parameters<typeof reportsService.getAttendanceReport>[0];
  const result = await reportsService.getAttendanceReport(query);
  sendSuccess(res, result);
}

async function exportAttendanceReport(req: Request, res: Response): Promise<void> {
  const query = req.validated!.query as Parameters<typeof reportsService.exportAttendanceReportCsv>[1];
  const csv = await reportsService.exportAttendanceReportCsv(req.user!, query);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="attendance-report.csv"');
  res.send(csv);
}

async function leaveReport(req: Request, res: Response): Promise<void> {
  const query = req.validated!.query as Parameters<typeof reportsService.getLeaveReport>[0];
  const result = await reportsService.getLeaveReport(query);
  sendSuccess(res, result);
}

async function exportLeaveReport(req: Request, res: Response): Promise<void> {
  const query = req.validated!.query as Parameters<typeof reportsService.exportLeaveReportCsv>[1];
  const csv = await reportsService.exportLeaveReportCsv(req.user!, query);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="leave-report.csv"');
  res.send(csv);
}

async function employeeReport(req: Request, res: Response): Promise<void> {
  const query = req.validated!.query as Parameters<typeof reportsService.getEmployeeReport>[0];
  const result = await reportsService.getEmployeeReport(query);
  sendSuccess(res, result);
}

async function exportEmployeeReport(req: Request, res: Response): Promise<void> {
  const query = req.validated!.query as Parameters<typeof reportsService.exportEmployeeReportCsv>[1];
  const csv = await reportsService.exportEmployeeReportCsv(req.user!, query);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="employee-report.csv"');
  res.send(csv);
}

async function departmentReport(req: Request, res: Response): Promise<void> {
  const query = req.validated!.query as Parameters<typeof reportsService.getDepartmentReport>[0];
  const result = await reportsService.getDepartmentReport(query);
  sendSuccess(res, result);
}

async function monthlySummaryReport(req: Request, res: Response): Promise<void> {
  const query = req.validated!.query as {
    page: number;
    limit: number;
    year?: number;
    month?: number;
    department?: string;
    designation?: string;
    search?: string;
    sortBy: "fullName" | "employeeId" | "joiningDate" | "createdAt";
    sortOrder: "asc" | "desc";
  };
  const { year, month } = { ...currentYearMonth(), ...query };
  const result = await reportsService.getMonthlySummaryReport({ ...query, year, month });
  sendSuccess(res, result);
}

async function exportMonthlySummaryReport(req: Request, res: Response): Promise<void> {
  const query = req.validated!.query as {
    year?: number;
    month?: number;
    department?: string;
    designation?: string;
    search?: string;
  };
  const { year, month } = { ...currentYearMonth(), ...query };
  const csv = await reportsService.exportMonthlySummaryReportCsv(req.user!, { ...query, year, month });
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="monthly-summary-report.csv"');
  res.send(csv);
}

async function printLog(req: Request, res: Response): Promise<void> {
  const { reportType } = req.body as { reportType: string };
  await reportsService.logReportPrint(req.user!, reportType);
  sendSuccess(res, {}, "Print logged");
}

export {
  attendanceReport,
  exportAttendanceReport,
  leaveReport,
  exportLeaveReport,
  employeeReport,
  exportEmployeeReport,
  departmentReport,
  monthlySummaryReport,
  exportMonthlySummaryReport,
  printLog,
};
