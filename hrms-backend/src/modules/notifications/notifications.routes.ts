import { Router } from "express";
import { authenticate } from "../../shared/middleware/authenticate";
import { validate } from "../../shared/middleware/validate";
import { listNotificationsSchema, markReadSchema } from "./notifications.validation";
import * as notificationsController from "./notifications.controller";

const router = Router();

router.use(authenticate);

router.get("/", validate(listNotificationsSchema), notificationsController.list);
router.get("/unread-count", notificationsController.unreadCount);
router.patch("/read-all", notificationsController.markAllRead);
router.patch("/:id/read", validate(markReadSchema), notificationsController.markRead);

export default router;
