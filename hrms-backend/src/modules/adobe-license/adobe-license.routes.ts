import { Router } from "express";
import { authenticate } from "../../shared/middleware/authenticate";
import { authorize } from "../../shared/middleware/authorize";
import { validate } from "../../shared/middleware/validate";
import { ROLES } from "../../shared/constants/roles";
import {
  grantAccessSchema,
  updateSheetSchema,
  userIdParamSchema,
} from "./adobe-license.validation";
import * as adobeLicenseController from "./adobe-license.controller";

// Sheet read/write is relationship-based (admin OR a specifically granted
// user — see adobe-license.service.ts), same shape as task permissions, so
// no blanket role gate on GET/PUT. Access-list management (who is granted)
// is a genuine admin-only action, gated below.
const router = Router();
const manage = authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN);

router.use(authenticate);

// Literal /access routes registered ahead of nothing dynamic here (no
// /adobe-licenses/:id), but kept above the bare GET/PUT for readability.
router.get("/adobe-licenses/access/me", adobeLicenseController.myAccess);
router.get("/adobe-licenses/access", manage, adobeLicenseController.listAccess);
router.post(
  "/adobe-licenses/access/:userId",
  manage,
  validate(grantAccessSchema),
  adobeLicenseController.grantAccess
);
router.delete(
  "/adobe-licenses/access/:userId",
  manage,
  validate(userIdParamSchema),
  adobeLicenseController.revokeAccess
);

router.get("/adobe-licenses", adobeLicenseController.getSheet);
router.put("/adobe-licenses", validate(updateSheetSchema), adobeLicenseController.updateSheet);

export default router;
