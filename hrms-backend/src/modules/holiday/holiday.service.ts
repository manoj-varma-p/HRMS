import { ApiError } from "../../shared/errors/ApiError";
import { ACTIVITY_ACTIONS } from "../../shared/constants/activityActions";
import { NOTIFICATION_TYPES } from "../../shared/constants/notificationTypes";
import { toId } from "../../shared/utils/toId";
import { recordActivity } from "../activity-log/activity-log.service";
import { notifyEveryone } from "../notifications/notifications.service";
import { HolidayModel, HolidayType, IHoliday } from "./holiday.model";

interface Actor {
  id: string;
  employeeId: string;
}

export function listHolidays(includeInactive: boolean, year?: number): Promise<IHoliday[]> {
  const filter: Record<string, unknown> = includeInactive ? {} : { isActive: true };
  if (year) {
    filter.date = { $gte: `${year}-01-01`, $lte: `${year}-12-31` };
  }
  return HolidayModel.find(filter).sort({ date: 1 });
}

interface CreateHolidayInput {
  date: string;
  name: string;
  description?: string;
  type: HolidayType;
}

export async function createHoliday(actor: Actor, input: CreateHolidayInput): Promise<IHoliday> {
  const existing = await HolidayModel.findOne({ date: input.date });
  if (existing) {
    throw new ApiError(409, `A holiday is already recorded for ${input.date}`);
  }

  const holiday = await HolidayModel.create({
    date: input.date,
    name: input.name,
    description: input.description ?? null,
    type: input.type,
    isActive: true,
  });

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.HOLIDAY_CREATED,
    targetType: "Holiday",
    targetId: toId(holiday),
    metadata: { date: input.date, name: input.name },
  });

  await notifyEveryone(actor.id, {
    type: NOTIFICATION_TYPES.HOLIDAY_ADDED,
    title: "New holiday added",
    message: `${input.name} on ${input.date} has been added to the holiday calendar`,
    metadata: { holidayId: toId(holiday) },
  });

  return holiday;
}

interface UpdateHolidayInput {
  date?: string;
  name?: string;
  description?: string | null;
  type?: HolidayType;
}

export async function updateHoliday(
  actor: Actor,
  id: string,
  input: UpdateHolidayInput
): Promise<IHoliday> {
  const holiday = await HolidayModel.findById(id);
  if (!holiday) throw new ApiError(404, "Holiday not found");

  if (input.date && input.date !== holiday.date) {
    const existing = await HolidayModel.findOne({ date: input.date });
    if (existing) {
      throw new ApiError(409, `A holiday is already recorded for ${input.date}`);
    }
    holiday.date = input.date;
  }
  if (input.name !== undefined) holiday.name = input.name;
  if (input.description !== undefined) holiday.description = input.description;
  if (input.type !== undefined) holiday.type = input.type;

  await holiday.save();

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.HOLIDAY_UPDATED,
    targetType: "Holiday",
    targetId: toId(holiday),
    metadata: { changes: input },
  });

  return holiday;
}

export async function setHolidayActive(
  actor: Actor,
  id: string,
  isActive: boolean
): Promise<IHoliday> {
  const holiday = await HolidayModel.findByIdAndUpdate(id, { isActive }, { new: true });
  if (!holiday) throw new ApiError(404, "Holiday not found");

  await recordActivity({
    actor,
    action: isActive
      ? ACTIVITY_ACTIONS.HOLIDAY_ACTIVATED
      : ACTIVITY_ACTIONS.HOLIDAY_DEACTIVATED,
    targetType: "Holiday",
    targetId: toId(holiday),
    metadata: { isActive },
  });

  return holiday;
}
