import { Router } from "express";
import { authenticate } from "../../shared/middleware/authenticate";
import { authorize } from "../../shared/middleware/authorize";
import { validate } from "../../shared/middleware/validate";
import { ROLES } from "../../shared/constants/roles";
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
  announcementIdSchema,
  adminListAnnouncementsSchema,
  listAnnouncementsSchema,
} from "./announcements.validation";
import * as announcementsController from "./announcements.controller";

const router = Router();
const manage = authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN);

router.use(authenticate);

router.get("/", validate(listAnnouncementsSchema), announcementsController.list);
router.get("/recent", announcementsController.recent);
router.get(
  "/admin",
  manage,
  validate(adminListAnnouncementsSchema),
  announcementsController.adminList
);
router.get("/:id", validate(announcementIdSchema), announcementsController.getById);

router.post("/", manage, validate(createAnnouncementSchema), announcementsController.create);
router.patch(
  "/:id",
  manage,
  validate(updateAnnouncementSchema),
  announcementsController.update
);
router.patch(
  "/:id/publish",
  manage,
  validate(announcementIdSchema),
  announcementsController.publish
);
router.patch(
  "/:id/archive",
  manage,
  validate(announcementIdSchema),
  announcementsController.archive
);

export default router;
