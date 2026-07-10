import { Request, Response } from "express";
import { sendSuccess } from "../../shared/utils/ApiResponse";
import * as notificationsService from "./notifications.service";

async function list(req: Request, res: Response): Promise<void> {
  const query = req.validated!.query as { page: number; limit: number; unreadOnly: boolean };
  const result = await notificationsService.listNotifications(req.user!.id, query);
  sendSuccess(res, result);
}

async function unreadCount(req: Request, res: Response): Promise<void> {
  const count = await notificationsService.getUnreadCount(req.user!.id);
  sendSuccess(res, { count });
}

async function markRead(req: Request, res: Response): Promise<void> {
  const { id } = req.validated!.params as { id: string };
  const notification = await notificationsService.markRead(req.user!.id, id);
  sendSuccess(res, { notification }, "Notification marked as read");
}

async function markAllRead(req: Request, res: Response): Promise<void> {
  const result = await notificationsService.markAllRead(req.user!.id);
  sendSuccess(res, result, "All notifications marked as read");
}

export { list, unreadCount, markRead, markAllRead };
