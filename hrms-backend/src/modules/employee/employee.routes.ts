import { Router } from "express";
import { authenticate } from "../../shared/middleware/authenticate";
import { authorize } from "../../shared/middleware/authorize";
import { validate } from "../../shared/middleware/validate";
import { ROLES } from "../../shared/constants/roles";
import {
  createEmployeeSchema,
  getEmployeeSchema,
  listEmployeesSchema,
  updateEmployeeSchema,
  updateProfileSchema,
} from "./employee.validation";
import * as employeeController from "./employee.controller";

const router = Router();
const manage = authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN);

router.use(authenticate);

router.get("/me", employeeController.getMe);
router.patch(
  "/me",
  validate(updateProfileSchema),
  employeeController.updateMe
);

router.get("/", manage, validate(listEmployeesSchema), employeeController.list);
router.post(
  "/",
  manage,
  validate(createEmployeeSchema),
  employeeController.create
);

router.get(
  "/:id",
  validate(getEmployeeSchema),
  employeeController.getById
);
router.patch(
  "/:id",
  manage,
  validate(updateEmployeeSchema),
  employeeController.update
);
router.patch(
  "/:id/activate",
  manage,
  validate(getEmployeeSchema),
  employeeController.activate
);
router.patch(
  "/:id/deactivate",
  manage,
  validate(getEmployeeSchema),
  employeeController.deactivate
);
router.patch(
  "/:id/promote-to-permanent",
  manage,
  validate(getEmployeeSchema),
  employeeController.promoteToPermanent
);
router.delete(
  "/:id",
  manage,
  validate(getEmployeeSchema),
  employeeController.remove
);

export default router;
