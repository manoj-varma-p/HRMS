import { Router } from "express";
import { authenticate } from "../../shared/middleware/authenticate";
import { authorize } from "../../shared/middleware/authorize";
import { validate } from "../../shared/middleware/validate";
import { ROLES } from "../../shared/constants/roles";
import { searchQuerySchema } from "./search.validation";
import * as searchController from "./search.controller";

const router = Router();

router.use(authenticate, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN));
router.get("/", validate(searchQuerySchema), searchController.search);

export default router;
