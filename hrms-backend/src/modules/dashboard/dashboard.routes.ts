import { Router } from "express";
import { authenticate } from "../../shared/middleware/authenticate";
import { authorize } from "../../shared/middleware/authorize";
import { ROLES } from "../../shared/constants/roles";
import * as dashboardController from "./dashboard.controller";

const router = Router();

router.use(authenticate);

router.get("/admin", authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN), dashboardController.admin);

export default router;
