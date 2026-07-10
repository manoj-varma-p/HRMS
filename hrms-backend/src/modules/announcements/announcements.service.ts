import { ApiError } from "../../shared/errors/ApiError";
import { ROLES } from "../../shared/constants/roles";
import { ACTIVITY_ACTIONS } from "../../shared/constants/activityActions";
import { NOTIFICATION_TYPES } from "../../shared/constants/notificationTypes";
import { toId } from "../../shared/utils/toId";
import { escapeRegex } from "../../shared/utils/regex";
import { getISTDateString } from "../../shared/utils/istDate";
import { recordActivity } from "../activity-log/activity-log.service";
import { notifyEveryone } from "../notifications/notifications.service";
import {
  ANNOUNCEMENT_PRIORITY,
  ANNOUNCEMENT_STATUS,
  AnnouncementModel,
  AnnouncementPriority,
  AnnouncementStatus,
  IAnnouncement,
} from "./announcement.model";

interface Actor {
  id: string;
  role: string;
  employeeId: string;
}

function toPublicAnnouncement(a: IAnnouncement) {
  return {
    id: toId(a),
    title: a.title,
    description: a.description,
    priority: a.priority,
    status: a.status,
    expiryDate: a.expiryDate,
    createdBy: a.createdBy,
    publishedAt: a.publishedAt,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}


function paginate(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

interface CreateAnnouncementInput {
  title: string;
  description: string;
  priority: AnnouncementPriority;
  expiryDate?: string;
}

export async function createAnnouncement(actor: Actor, input: CreateAnnouncementInput) {
  const announcement = await AnnouncementModel.create({
    title: input.title,
    description: input.description,
    priority: input.priority,
    expiryDate: input.expiryDate ?? null,
    status: ANNOUNCEMENT_STATUS.DRAFT,
    createdBy: actor.id,
  });

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.ANNOUNCEMENT_CREATED,
    targetType: "Announcement",
    targetId: toId(announcement),
    metadata: { title: announcement.title, priority: announcement.priority },
  });

  return toPublicAnnouncement(announcement);
}

interface UpdateAnnouncementInput {
  title?: string;
  description?: string;
  priority?: AnnouncementPriority;
  expiryDate?: string | null;
}

export async function updateAnnouncement(
  actor: Actor,
  id: string,
  input: UpdateAnnouncementInput
) {
  const announcement = await AnnouncementModel.findById(id);
  if (!announcement) throw new ApiError(404, "Announcement not found");

  if (input.title !== undefined) announcement.title = input.title;
  if (input.description !== undefined) announcement.description = input.description;
  if (input.priority !== undefined) announcement.priority = input.priority;
  if (input.expiryDate !== undefined) announcement.expiryDate = input.expiryDate;

  await announcement.save();

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.ANNOUNCEMENT_UPDATED,
    targetType: "Announcement",
    targetId: toId(announcement),
    metadata: { changes: input },
  });

  return toPublicAnnouncement(announcement);
}

export async function publishAnnouncement(actor: Actor, id: string) {
  const announcement = await AnnouncementModel.findById(id);
  if (!announcement) throw new ApiError(404, "Announcement not found");
  if (announcement.status === ANNOUNCEMENT_STATUS.PUBLISHED) {
    throw new ApiError(409, "This announcement is already published");
  }

  announcement.status = ANNOUNCEMENT_STATUS.PUBLISHED;
  announcement.publishedAt = new Date();
  await announcement.save();

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.ANNOUNCEMENT_PUBLISHED,
    targetType: "Announcement",
    targetId: toId(announcement),
    metadata: { title: announcement.title },
  });

  await notifyEveryone(actor.id, {
    type: NOTIFICATION_TYPES.ANNOUNCEMENT_PUBLISHED,
    title: "New announcement",
    message: announcement.title,
    metadata: { announcementId: toId(announcement) },
  });

  return toPublicAnnouncement(announcement);
}

export async function archiveAnnouncement(actor: Actor, id: string) {
  const announcement = await AnnouncementModel.findById(id);
  if (!announcement) throw new ApiError(404, "Announcement not found");
  if (announcement.status === ANNOUNCEMENT_STATUS.ARCHIVED) {
    throw new ApiError(409, "This announcement is already archived");
  }

  announcement.status = ANNOUNCEMENT_STATUS.ARCHIVED;
  await announcement.save();

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.ANNOUNCEMENT_ARCHIVED,
    targetType: "Announcement",
    targetId: toId(announcement),
    metadata: { title: announcement.title },
  });

  return toPublicAnnouncement(announcement);
}

interface AdminListQuery {
  page: number;
  limit: number;
  search?: string;
  status?: AnnouncementStatus;
  priority?: AnnouncementPriority;
}

export async function adminListAnnouncements(query: AdminListQuery) {
  const filter: Record<string, unknown> = {};
  if (query.search) filter.title = new RegExp(escapeRegex(query.search.trim()), "i");
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    AnnouncementModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
    AnnouncementModel.countDocuments(filter),
  ]);

  return {
    announcements: items.map(toPublicAnnouncement),
    pagination: paginate(query.page, query.limit, total),
  };
}

interface PublicListQuery {
  page: number;
  limit: number;
  search?: string;
}

// Employee-facing feed: published, non-expired only.
export async function listPublishedAnnouncements(query: PublicListQuery) {
  const todayStr = getISTDateString(new Date());
  const filter: Record<string, unknown> = {
    status: ANNOUNCEMENT_STATUS.PUBLISHED,
    $or: [{ expiryDate: null }, { expiryDate: { $gte: todayStr } }],
  };
  if (query.search) {
    filter.title = new RegExp(escapeRegex(query.search.trim()), "i");
  }

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    AnnouncementModel.find(filter).sort({ publishedAt: -1 }).skip(skip).limit(query.limit),
    AnnouncementModel.countDocuments(filter),
  ]);

  return {
    announcements: items.map(toPublicAnnouncement),
    pagination: paginate(query.page, query.limit, total),
  };
}

export async function getRecentPublishedAnnouncements(limit = 5) {
  const todayStr = getISTDateString(new Date());
  const items = await AnnouncementModel.find({
    status: ANNOUNCEMENT_STATUS.PUBLISHED,
    $or: [{ expiryDate: null }, { expiryDate: { $gte: todayStr } }],
  })
    .sort({ publishedAt: -1 })
    .limit(limit);
  return items.map(toPublicAnnouncement);
}

export async function getAnnouncementById(actor: Actor, id: string) {
  const announcement = await AnnouncementModel.findById(id);
  if (!announcement) throw new ApiError(404, "Announcement not found");

  const isAdmin = actor.role === ROLES.ADMIN || actor.role === ROLES.SUPER_ADMIN;
  if (!isAdmin) {
    const todayStr = getISTDateString(new Date());
    const isExpired = announcement.expiryDate !== null && announcement.expiryDate < todayStr;
    if (announcement.status !== ANNOUNCEMENT_STATUS.PUBLISHED || isExpired) {
      throw new ApiError(404, "Announcement not found");
    }
  }

  return toPublicAnnouncement(announcement);
}

export { ANNOUNCEMENT_PRIORITY, ANNOUNCEMENT_STATUS };
