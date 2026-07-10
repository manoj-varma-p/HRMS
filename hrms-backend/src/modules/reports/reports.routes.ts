import { Router } from "express";
import { authenticate } from "../../shared/middleware/authenticate";
import { authorize } from "../../shared/middleware/authorize";
import { validate } from "../../shared/middleware/validate";
import { ROLES } from "../../shared/constants/roles";
import {
  attendanceReportQuerySchema,
  attendanceReportExportQuerySchema,
  leaveReportQuerySchema,
  leaveReportExportQuerySchema,
  employeeReportQuerySchema,
  employeeReportExportQuerySchema,
  departmentReportQuerySchema,
  monthlySummaryReportQuerySchema,
  printLogSchema,
} from "./reports.validation";
import * as reportsController from "./reports.controller";

const router = Router();

router.use(authenticate, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN));

router.get("/attendance", validate(attendanceReportQuerySchema), reportsController.attendanceReport);
router.get(
  "/attendance/export",
  validate(attendanceReportExportQuerySchema),
  reportsController.exportAttendanceReport
);

router.get("/leave", validate(leaveReportQuerySchema), reportsController.leaveReport);
router.get(
  "/leave/export",
  validate(leaveReportExportQuerySchema),
  reportsController.exportLeaveReport
);

router.get("/employees", validate(employeeReportQuerySchema), reportsController.employeeReport);
router.get(
  "/employees/export",
  validate(employeeReportExportQuerySchema),
  reportsController.exportEmployeeReport
);

router.get("/departments", validate(departmentReportQuerySchema), reportsController.departmentReport);

router.get(
  "/monthly-summary",
  validate(monthlySummaryReportQuerySchema),
  reportsController.monthlySummaryReport
);

router.post("/print-log", validate(printLogSchema), reportsController.printLog);

export default router;
