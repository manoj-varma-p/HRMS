import { Router } from "express";
import { authenticate } from "../../shared/middleware/authenticate";
import { authorize } from "../../shared/middleware/authorize";
import { validate } from "../../shared/middleware/validate";
import { ROLES } from "../../shared/constants/roles";
import {
  adminListLeavesSchema,
  applyLeaveSchema,
  balanceQuerySchema,
  leaveIdParamSchema,
  listLeavesSchema,
  reviewLeaveSchema,
} from "./leave.validation";
import * as leaveController from "./leave.controller";

const router = Router();
const manage = authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN);

router.use(authenticate);

router.post("/", validate(applyLeaveSchema), leaveController.apply);
router.get("/me", validate(listLeavesSchema), leaveController.mine);
router.get("/balance", validate(balanceQuerySchema), leaveController.balance);
router.patch(
  "/:id/cancel",
  validate(leaveIdParamSchema),
  leaveController.cancel
);

router.get("/", manage, validate(adminListLeavesSchema), leaveController.adminList);
router.patch(
  "/:id/approve",
  manage,
  validate(reviewLeaveSchema),
  leaveController.approve
);
router.patch(
  "/:id/reject",
  manage,
  validate(reviewLeaveSchema),
  leaveController.reject
);

export default router;
