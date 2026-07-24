import { ApiError } from "../../shared/errors/ApiError";
import { ROLES, Role } from "../../shared/constants/roles";
import { ACTIVITY_ACTIONS } from "../../shared/constants/activityActions";
import { toId } from "../../shared/utils/toId";
import { recordActivity } from "../activity-log/activity-log.service";
import { UserModel } from "../user/user.model";
import {
  AdobeLicenseAccessPermission,
  AdobeLicenseSheetModel,
  IAdobeLicenseColumn,
  IAdobeLicenseSheet,
} from "./adobe-license.model";

interface Actor {
  id: string;
  role: Role;
  employeeId: string;
}

interface Access {
  canView: boolean;
  canEdit: boolean;
  canManageAccess: boolean;
}

const DEFAULT_COLUMNS: IAdobeLicenseColumn[] = [
  { name: "Email", type: "text" },
  { name: "Password", type: "text" },
  { name: "Adobe Password", type: "text" },
  { name: "D.O.P", type: "date" },
  { name: "Auto Renewal", type: "date" },
  { name: "Plan", type: "text" },
  { name: "Payment", type: "text" },
  { name: "Student's Details", type: "tags" },
];

function isAdmin(actor: Actor): boolean {
  return actor.role === ROLES.ADMIN || actor.role === ROLES.SUPER_ADMIN;
}

function findGrant(sheet: IAdobeLicenseSheet, actorId: string) {
  return sheet.accessGrants.find((g) => g.user.toString() === actorId);
}

function inferLegacyColumnType(name: string): IAdobeLicenseColumn["type"] {
  const normalized = name.trim().toLowerCase();
  if (normalized === "d.o.p" || normalized === "auto renewal") return "date";
  if (normalized === "student's details") return "tags";
  return "text";
}

// One-time, idempotent upgrade of documents written by the earlier version
// of this feature (plain string[] columns, flat allowedUsers: ObjectId[])
// into the current shape (typed {name,type}[] columns, accessGrants[] with
// a permission tier). Runs against the raw driver collection — bypassing
// Mongoose's schema casting entirely — because casting a legacy string
// column straight into the new subdocument schema would throw a
// CastError before we ever get a chance to migrate it. Existing grants are
// grandfathered in as "edit" (their prior access was unconditional), never
// silently downgraded to view-only.
async function migrateLegacyShapeIfNeeded(): Promise<void> {
  const raw = await AdobeLicenseSheetModel.collection.findOne({ key: "singleton" });
  if (!raw) return;

  const needsColumnMigration =
    Array.isArray(raw.columns) && raw.columns.length > 0 && typeof raw.columns[0] === "string";
  const needsAccessMigration = Array.isArray(raw.allowedUsers);

  if (!needsColumnMigration && !needsAccessMigration) return;

  const update: Record<string, unknown> = {};
  if (needsColumnMigration) {
    update.columns = (raw.columns as string[]).map((name) => ({
      name,
      type: inferLegacyColumnType(name),
    }));
  }
  if (needsAccessMigration) {
    update.accessGrants = (raw.allowedUsers as unknown[]).map((user) => ({
      user,
      permission: "edit",
    }));
  }

  await AdobeLicenseSheetModel.collection.updateOne(
    { key: "singleton" },
    { $set: update, $unset: { allowedUsers: "" } }
  );
}

// Same find-or-create shape as configuration.service.ts's
// getOrCreateConfiguration — the `key: "singleton"` unique index guarantees
// at most one document even under a race.
async function getOrCreateSheet(): Promise<IAdobeLicenseSheet> {
  await migrateLegacyShapeIfNeeded();
  let sheet = await AdobeLicenseSheetModel.findOne({ key: "singleton" });
  if (!sheet) {
    sheet = await AdobeLicenseSheetModel.create({
      key: "singleton",
      columns: DEFAULT_COLUMNS,
      rows: [],
    });
  }
  return sheet;
}

function resolveAccess(actor: Actor, sheet: IAdobeLicenseSheet): Access {
  if (isAdmin(actor)) {
    return { canView: true, canEdit: true, canManageAccess: true };
  }
  const grant = findGrant(sheet, actor.id);
  if (!grant) {
    return { canView: false, canEdit: false, canManageAccess: false };
  }
  return { canView: true, canEdit: grant.permission === "edit", canManageAccess: false };
}

function assertCanView(actor: Actor, sheet: IAdobeLicenseSheet): Access {
  const access = resolveAccess(actor, sheet);
  if (!access.canView) {
    throw new ApiError(403, "You do not have access to Adobe Licenses");
  }
  return access;
}

function toPublicSheet(sheet: IAdobeLicenseSheet, access: Access) {
  return {
    id: sheet._id.toString(),
    title: sheet.title,
    columns: sheet.columns.map((c) => ({ name: c.name, type: c.type })),
    rows: sheet.rows,
    canEdit: access.canEdit,
    canManageAccess: access.canManageAccess,
    updatedAt: sheet.updatedAt,
  };
}

export async function getSheet(actor: Actor) {
  const sheet = await getOrCreateSheet();
  const access = assertCanView(actor, sheet);
  return toPublicSheet(sheet, access);
}

export interface UpdateSheetInput {
  title?: string;
  columns?: IAdobeLicenseColumn[];
  rows?: string[][];
}

export async function updateSheet(actor: Actor, input: UpdateSheetInput) {
  const sheet = await getOrCreateSheet();
  const access = assertCanView(actor, sheet);
  if (!access.canEdit) {
    throw new ApiError(403, "You have view-only access to Adobe Licenses");
  }

  if (input.title !== undefined) sheet.title = input.title;
  if (input.columns !== undefined) sheet.columns = input.columns;
  if (input.rows !== undefined) sheet.rows = input.rows;
  sheet.updatedBy = actor.id as unknown as IAdobeLicenseSheet["updatedBy"];

  await sheet.save();

  // Metadata deliberately never includes row content — this sheet stores
  // Adobe account passwords in its cells, so the audit trail records what
  // changed (which fields, how many rows, which column names/types) without
  // ever writing actual cell values into the activity log.
  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.ADOBE_LICENSE_SHEET_UPDATED,
    targetType: "AdobeLicenseSheet",
    targetId: toId(sheet),
    metadata: {
      titleChanged: input.title !== undefined,
      ...(input.title !== undefined ? { title: input.title } : {}),
      columnsChanged: input.columns !== undefined,
      ...(input.columns !== undefined
        ? { columns: input.columns.map((c) => ({ name: c.name, type: c.type })) }
        : {}),
      rowsChanged: input.rows !== undefined,
      ...(input.rows !== undefined ? { rowCount: input.rows.length } : {}),
    },
  });

  return toPublicSheet(sheet, access);
}

export async function checkMyAccess(
  actor: Actor
): Promise<{ hasAccess: boolean; canEdit: boolean }> {
  const sheet = await getOrCreateSheet();
  const access = resolveAccess(actor, sheet);
  return { hasAccess: access.canView, canEdit: access.canEdit };
}

interface PublicAccessUser {
  id: string;
  fullName: string;
  employeeId: string;
  email: string;
  permission: AdobeLicenseAccessPermission;
}

async function populatedAccessList(sheet: IAdobeLicenseSheet): Promise<PublicAccessUser[]> {
  await sheet.populate<{
    accessGrants: {
      user: { _id: unknown; fullName: string; employeeId: string; email: string };
      permission: AdobeLicenseAccessPermission;
    }[];
  }>({ path: "accessGrants.user", select: "fullName employeeId email" });

  return (
    sheet.accessGrants as unknown as {
      user: { _id: unknown; fullName: string; employeeId: string; email: string };
      permission: AdobeLicenseAccessPermission;
    }[]
  ).map((grant) => ({
    id: grant.user._id!.toString(),
    fullName: grant.user.fullName,
    employeeId: grant.user.employeeId,
    email: grant.user.email,
    permission: grant.permission,
  }));
}

export async function listAccess(): Promise<PublicAccessUser[]> {
  const sheet = await getOrCreateSheet();
  return populatedAccessList(sheet);
}

export async function grantAccess(
  actor: Actor,
  userId: string,
  permission: AdobeLicenseAccessPermission
): Promise<PublicAccessUser[]> {
  const target = await UserModel.findById(userId);
  if (!target) {
    throw new ApiError(404, "User not found");
  }

  const sheet = await getOrCreateSheet();
  const existing = findGrant(sheet, userId);
  if (existing) {
    existing.permission = permission;
  } else {
    sheet.accessGrants.push({
      user: userId as unknown as IAdobeLicenseSheet["accessGrants"][number]["user"],
      permission,
    });
  }
  await sheet.save();

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.ADOBE_LICENSE_ACCESS_GRANTED,
    targetType: "AdobeLicenseSheet",
    targetId: toId(sheet),
    metadata: { name: target.fullName, targetEmployeeId: target.employeeId, permission },
  });

  return populatedAccessList(sheet);
}

export async function revokeAccess(actor: Actor, userId: string): Promise<PublicAccessUser[]> {
  const target = await UserModel.findById(userId);

  const sheet = await getOrCreateSheet();
  sheet.accessGrants = sheet.accessGrants.filter(
    (g) => g.user.toString() !== userId
  ) as IAdobeLicenseSheet["accessGrants"];
  await sheet.save();

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.ADOBE_LICENSE_ACCESS_REVOKED,
    targetType: "AdobeLicenseSheet",
    targetId: toId(sheet),
    metadata: { name: target?.fullName, targetEmployeeId: target?.employeeId ?? userId },
  });

  return populatedAccessList(sheet);
}
