import { Request, Response } from "express";
import { ApiError } from "../../shared/errors/ApiError";
import { sendSuccess } from "../../shared/utils/ApiResponse";
import * as taskService from "./task.service";

async function create(req: Request, res: Response): Promise<void> {
  const task = await taskService.createTask(req.user!, req.body);
  sendSuccess(res, { task }, "Task created", 201);
}

async function mine(req: Request, res: Response): Promise<void> {
  const query = req.validated!.query as Parameters<typeof taskService.listMyTasks>[1];
  const result = await taskService.listMyTasks(req.user!, query);
  sendSuccess(res, result);
}

async function team(req: Request, res: Response): Promise<void> {
  const query = req.validated!.query as Parameters<typeof taskService.listTeamTasks>[1];
  const result = await taskService.listTeamTasks(req.user!, query);
  sendSuccess(res, result);
}

async function adminList(req: Request, res: Response): Promise<void> {
  const query = req.validated!.query as Parameters<typeof taskService.adminListTasks>[0];
  const result = await taskService.adminListTasks(query);
  sendSuccess(res, result);
}

async function getById(req: Request, res: Response): Promise<void> {
  const task = await taskService.getTaskById(req.user!, String(req.params.taskId));
  sendSuccess(res, { task });
}

async function update(req: Request, res: Response): Promise<void> {
  const task = await taskService.updateTask(req.user!, String(req.params.taskId), req.body);
  sendSuccess(res, { task }, "Task updated");
}

async function changeStatus(req: Request, res: Response): Promise<void> {
  const task = await taskService.changeTaskStatus(
    req.user!,
    String(req.params.taskId),
    req.body.status,
    req.body.comment
  );
  sendSuccess(res, { task }, "Task status updated");
}

async function reassign(req: Request, res: Response): Promise<void> {
  const task = await taskService.reassignTask(
    req.user!,
    String(req.params.taskId),
    req.body.assignedTo
  );
  sendSuccess(res, { task }, "Task reassigned");
}

async function cancel(req: Request, res: Response): Promise<void> {
  const task = await taskService.cancelTask(req.user!, String(req.params.taskId));
  sendSuccess(res, { task }, "Task cancelled");
}

async function addComment(req: Request, res: Response): Promise<void> {
  const comment = await taskService.addTaskComment(
    req.user!,
    String(req.params.taskId),
    req.body.body
  );
  sendSuccess(res, { comment }, "Comment added", 201);
}

async function listComments(req: Request, res: Response): Promise<void> {
  const query = req.validated!.query as Parameters<typeof taskService.listTaskComments>[2];
  const result = await taskService.listTaskComments(req.user!, String(req.params.taskId), query);
  sendSuccess(res, result);
}

async function uploadAttachment(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    throw new ApiError(422, "Upload a PDF, JPEG, PNG, or DOCX file under 10MB");
  }
  const attachment = await taskService.uploadTaskAttachment(
    req.user!,
    String(req.params.taskId),
    req.file
  );
  sendSuccess(res, { attachment }, "Attachment uploaded", 201);
}

async function listAttachments(req: Request, res: Response): Promise<void> {
  const attachments = await taskService.listTaskAttachments(req.user!, String(req.params.taskId));
  sendSuccess(res, { attachments });
}

async function getAttachmentDownloadUrl(req: Request, res: Response): Promise<void> {
  const url = await taskService.getTaskAttachmentDownloadUrl(
    req.user!,
    String(req.params.attachmentId)
  );
  sendSuccess(res, { url });
}

async function deleteAttachment(req: Request, res: Response): Promise<void> {
  const attachment = await taskService.deleteTaskAttachment(
    req.user!,
    String(req.params.attachmentId)
  );
  sendSuccess(res, { attachment }, "Attachment deleted");
}

export {
  create,
  mine,
  team,
  adminList,
  getById,
  update,
  changeStatus,
  reassign,
  cancel,
  addComment,
  listComments,
  uploadAttachment,
  listAttachments,
  getAttachmentDownloadUrl,
  deleteAttachment,
};
