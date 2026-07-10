import { Request, Response } from "express";
import { sendSuccess } from "../../shared/utils/ApiResponse";
import * as announcementsService from "./announcements.service";

async function create(req: Request, res: Response): Promise<void> {
  const body = req.body as Parameters<typeof announcementsService.createAnnouncement>[1];
  const announcement = await announcementsService.createAnnouncement(req.user!, body);
  sendSuccess(res, { announcement }, "Announcement created", 201);
}

async function update(req: Request, res: Response): Promise<void> {
  const { id } = req.validated!.params as { id: string };
  const body = req.body as Parameters<typeof announcementsService.updateAnnouncement>[2];
  const announcement = await announcementsService.updateAnnouncement(req.user!, id, body);
  sendSuccess(res, { announcement }, "Announcement updated");
}

async function publish(req: Request, res: Response): Promise<void> {
  const { id } = req.validated!.params as { id: string };
  const announcement = await announcementsService.publishAnnouncement(req.user!, id);
  sendSuccess(res, { announcement }, "Announcement published");
}

async function archive(req: Request, res: Response): Promise<void> {
  const { id } = req.validated!.params as { id: string };
  const announcement = await announcementsService.archiveAnnouncement(req.user!, id);
  sendSuccess(res, { announcement }, "Announcement archived");
}

async function adminList(req: Request, res: Response): Promise<void> {
  const query = req.validated!.query as Parameters<
    typeof announcementsService.adminListAnnouncements
  >[0];
  const result = await announcementsService.adminListAnnouncements(query);
  sendSuccess(res, result);
}

async function list(req: Request, res: Response): Promise<void> {
  const query = req.validated!.query as Parameters<
    typeof announcementsService.listPublishedAnnouncements
  >[0];
  const result = await announcementsService.listPublishedAnnouncements(query);
  sendSuccess(res, result);
}

async function recent(req: Request, res: Response): Promise<void> {
  const announcements = await announcementsService.getRecentPublishedAnnouncements(5);
  sendSuccess(res, { announcements });
}

async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.validated!.params as { id: string };
  const announcement = await announcementsService.getAnnouncementById(req.user!, id);
  sendSuccess(res, { announcement });
}

export { create, update, publish, archive, adminList, list, recent, getById };
