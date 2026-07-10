import { Router } from "express";
import { authenticate } from "../../shared/middleware/authenticate";
import { authorize } from "../../shared/middleware/authorize";
import { validate } from "../../shared/middleware/validate";
import { ROLES } from "../../shared/constants/roles";
import {
  listCorrectionsSchema,
  requestCorrectionSchema,
  reviewCorrectionSchema,
} from "./attendance-correction.validation";
import * as correctionController from "./attendance-correction.controller";

const router = Router();
const manage = authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN);

router.use(authenticate);

router.post("/", validate(requestCorrectionSchema), correctionController.create);
router.get("/mine", validate(listCorrectionsSchema), correctionController.mine);

router.get("/", manage, validate(listCorrectionsSchema), correctionController.adminList);
router.patch(
  "/:id/approve",
  manage,
  validate(reviewCorrectionSchema),
  correctionController.approve
);
router.patch(
  "/:id/reject",
  manage,
  validate(reviewCorrectionSchema),
  correctionController.reject
);

export default router;
