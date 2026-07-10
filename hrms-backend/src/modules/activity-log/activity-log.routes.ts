import { Router } from "express";
import { authenticate } from "../../shared/middleware/authenticate";
import { authorize } from "../../shared/middleware/authorize";
import { validate } from "../../shared/middleware/validate";
import { ROLES } from "../../shared/constants/roles";
import { listActivitySchema } from "./activity-log.validation";
import * as activityLogController from "./activity-log.controller";

const router = Router();

router.use(authenticate, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN));

router.get("/", validate(listActivitySchema), activityLogController.list);

export default router;
