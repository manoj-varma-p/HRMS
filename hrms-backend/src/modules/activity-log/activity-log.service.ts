import { logger } from "../../shared/utils/logger";
import { toId } from "../../shared/utils/toId";
import { escapeRegex } from "../../shared/utils/regex";
import { ActivityAction } from "../../shared/constants/activityActions";
import { ActivityLogModel, IActivityLog } from "./activity-log.model";

interface RecordActivityInput {
  actor: { id: string; employeeId: string };
  action: ActivityAction;
  targetType: IActivityLog["targetType"];
  targetId: string;
  metadata?: Record<string, unknown>;
}

// Best-effort: activity logging must never block or fail the primary
// business operation it's attached to.
export async function recordActivity(input: RecordActivityInput): Promise<void> {
  try {
    await ActivityLogModel.create({
      actorId: input.actor.id,
      actorEmployeeId: input.actor.employeeId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: input.metadata,
    });
  } catch (err) {
    logger.error({ err, input }, "Failed to record activity log");
  }
}

// Read side, added in Phase 6 for the admin dashboard's recent-activity
// widget — the record side has existed since Phase 3.
export async function listRecentActivity(limit = 15) {
  const logs = await ActivityLogModel.find({}).sort({ createdAt: -1 }).limit(limit);
  return logs.map((log) => ({
    id: toId(log),
    action: log.action,
    actorEmployeeId: log.actorEmployeeId,
    targetType: log.targetType,
    metadata: log.metadata ?? null,
    createdAt: log.createdAt,
  }));
}

interface ActivityQuery {
  page: number;
  limit: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  action?: string;
  targetType?: string;
}

// Paginated/filterable read side, added in Phase 8 for the dedicated
// Activity Center — a separate export from listRecentActivity so the
// Phase 6 dashboard widget's behavior is untouched.
export async function listActivity(query: ActivityQuery) {
  const filter: Record<string, unknown> = {};
  if (query.action) filter.action = query.action;
  if (query.targetType) filter.targetType = query.targetType;
  if (query.search) {
    filter.actorEmployeeId = new RegExp(escapeRegex(query.search.trim()), "i");
  }
  if (query.startDate || query.endDate) {
    const createdAt: Record<string, Date> = {};
    if (query.startDate) createdAt.$gte = new Date(`${query.startDate}T00:00:00+05:30`);
    if (query.endDate) createdAt.$lte = new Date(`${query.endDate}T23:59:59+05:30`);
    filter.createdAt = createdAt;
  }

  const skip = (query.page - 1) * query.limit;
  const [logs, total] = await Promise.all([
    ActivityLogModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
    ActivityLogModel.countDocuments(filter),
  ]);

  return {
    activities: logs.map((log) => ({
      id: toId(log),
      action: log.action,
      actorEmployeeId: log.actorEmployeeId,
      targetType: log.targetType,
      metadata: log.metadata ?? null,
      createdAt: log.createdAt,
    })),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}
