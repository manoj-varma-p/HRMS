import { Router } from "express";
import { authenticate } from "../../shared/middleware/authenticate";
import { authorize } from "../../shared/middleware/authorize";
import { validate } from "../../shared/middleware/validate";
import { ROLES } from "../../shared/constants/roles";
import {
  createDesignationSchema,
  listDesignationsSchema,
  setDesignationActiveSchema,
  updateDesignationSchema,
} from "./designation.validation";
import * as designationController from "./designation.controller";

const router = Router();
const manage = authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN);

router.use(authenticate);

router.get("/", validate(listDesignationsSchema), designationController.list);
router.post(
  "/",
  manage,
  validate(createDesignationSchema),
  designationController.create
);
router.patch(
  "/:id",
  manage,
  validate(updateDesignationSchema),
  designationController.update
);
router.patch(
  "/:id/activate",
  manage,
  validate(setDesignationActiveSchema),
  designationController.activate
);
router.patch(
  "/:id/deactivate",
  manage,
  validate(setDesignationActiveSchema),
  designationController.deactivate
);

export default router;
