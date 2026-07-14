import { Router } from "express";
import { authenticate } from "../../shared/middleware/authenticate";
import { authorize } from "../../shared/middleware/authorize";
import { validate } from "../../shared/middleware/validate";
import { ROLES } from "../../shared/constants/roles";
import {
  createDepartmentSchema,
  listDepartmentsSchema,
  setDepartmentActiveSchema,
  setDepartmentHeadSchema,
  updateDepartmentSchema,
} from "./department.validation";
import * as departmentController from "./department.controller";

const router = Router();
const manage = authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN);

router.use(authenticate);

router.get("/", validate(listDepartmentsSchema), departmentController.list);
router.post("/", manage, validate(createDepartmentSchema), departmentController.create);
router.patch(
  "/:id",
  manage,
  validate(updateDepartmentSchema),
  departmentController.update
);
router.patch(
  "/:id/activate",
  manage,
  validate(setDepartmentActiveSchema),
  departmentController.activate
);
router.patch(
  "/:id/deactivate",
  manage,
  validate(setDepartmentActiveSchema),
  departmentController.deactivate
);
router.patch(
  "/:id/head",
  manage,
  validate(setDepartmentHeadSchema),
  departmentController.setHead
);

export default router;
