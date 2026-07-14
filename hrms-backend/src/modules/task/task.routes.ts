import { Router } from "express";
import { authenticate } from "../../shared/middleware/authenticate";
import { authorize } from "../../shared/middleware/authorize";
import { validate } from "../../shared/middleware/validate";
import { uploadDocument as uploadAttachmentMiddleware } from "../../shared/middleware/upload";
import { ROLES } from "../../shared/constants/roles";
import {
  addTaskCommentSchema,
  adminListTasksSchema,
  attachmentIdParamSchema,
  changeTaskStatusSchema,
  createTaskSchema,
  listMyTasksSchema,
  listTaskCommentsSchema,
  listTeamTasksSchema,
  reassignTaskSchema,
  taskIdParamSchema,
  updateTaskSchema,
} from "./task.validation";
import * as taskController from "./task.controller";

// No blanket role gate on most routes — like documents, task permissions
// are relationship-based (assignee/assigner/department head), not a fixed
// role tier, so every action is authorized inside task.service.ts. The
// org-wide admin list below is the one genuine role-only gate. Mounted
// unprefixed in modules/index.ts (both /tasks/... and the flat
// /task-attachments/:attachmentId/... paths live in this one router),
// matching document.routes.ts's /employees/:employeeId/documents +
// /documents/:documentId/... two-prefix shape.
const router = Router();
const manage = authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN);

router.use(authenticate);

// Literal paths registered before /tasks/:taskId — Express matches route
// patterns in registration order, so /tasks/me and /tasks/team must come
// first or they'd be swallowed by :taskId (same ordering leave.routes.ts
// uses for /me and /balance ahead of /:id/...).
router.post("/tasks", validate(createTaskSchema), taskController.create);
router.get("/tasks/me", validate(listMyTasksSchema), taskController.mine);
router.get("/tasks/team", validate(listTeamTasksSchema), taskController.team);
router.get("/tasks", manage, validate(adminListTasksSchema), taskController.adminList);

router.get("/tasks/:taskId", validate(taskIdParamSchema), taskController.getById);
router.patch("/tasks/:taskId", validate(updateTaskSchema), taskController.update);
router.patch(
  "/tasks/:taskId/status",
  validate(changeTaskStatusSchema),
  taskController.changeStatus
);
router.patch(
  "/tasks/:taskId/reassign",
  validate(reassignTaskSchema),
  taskController.reassign
);
router.delete("/tasks/:taskId", validate(taskIdParamSchema), taskController.cancel);

router.post(
  "/tasks/:taskId/comments",
  validate(addTaskCommentSchema),
  taskController.addComment
);
router.get(
  "/tasks/:taskId/comments",
  validate(listTaskCommentsSchema),
  taskController.listComments
);

router.post(
  "/tasks/:taskId/attachments",
  uploadAttachmentMiddleware,
  validate(taskIdParamSchema),
  taskController.uploadAttachment
);
router.get(
  "/tasks/:taskId/attachments",
  validate(taskIdParamSchema),
  taskController.listAttachments
);

router.get(
  "/task-attachments/:attachmentId/download-url",
  validate(attachmentIdParamSchema),
  taskController.getAttachmentDownloadUrl
);
router.delete(
  "/task-attachments/:attachmentId",
  validate(attachmentIdParamSchema),
  taskController.deleteAttachment
);

export default router;
