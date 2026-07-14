import {
  createReferenceData,
  listReferenceData,
  setReferenceDataActive,
  updateReferenceData,
} from "../../shared/services/referenceData.service";
import { ApiError } from "../../shared/errors/ApiError";
import { ACTIVITY_ACTIONS } from "../../shared/constants/activityActions";
import { recordActivity } from "../activity-log/activity-log.service";
import { UserModel } from "../user/user.model";
import { DepartmentModel, IDepartment } from "./department.model";
import { refreshDepartmentHeadsCache } from "./department.cache";
import { toId } from "../../shared/utils/toId";

const LABEL = "Department";

// Populated with the head's display info — the generic ReferenceDataManager
// (which only reads _id/name/isActive) ignores the extra fields, so this
// stays the one list function for both the plain reference-data table and
// the Department Head picker, rather than maintaining two nearly-identical
// queries.
export function listDepartments(includeInactive: boolean) {
  return listReferenceData(DepartmentModel, includeInactive).populate({
    path: "headEmployeeId",
    select: "fullName employeeId",
  });
}

export async function createDepartment(
  actor: { id: string; employeeId: string },
  name: string
): Promise<IDepartment> {
  const department = await createReferenceData(DepartmentModel, name, LABEL);
  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.DEPARTMENT_CREATED,
    targetType: "Department",
    targetId: toId(department),
    metadata: { name },
  });
  return department;
}

export async function updateDepartment(
  actor: { id: string; employeeId: string },
  id: string,
  name: string
): Promise<IDepartment> {
  const department = await updateReferenceData(DepartmentModel, id, name, LABEL);
  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.DEPARTMENT_UPDATED,
    targetType: "Department",
    targetId: toId(department),
    metadata: { name },
  });
  return department;
}

// null clears the head. Validates the employee actually exists — an
// admin picking from a live dropdown shouldn't normally hit this, but the
// check matters if the reference goes stale between load and submit.
export async function setDepartmentHead(
  actor: { id: string; employeeId: string },
  id: string,
  headEmployeeId: string | null
): Promise<IDepartment> {
  const department = await DepartmentModel.findById(id);
  if (!department) {
    throw new ApiError(404, `${LABEL} not found`);
  }

  if (headEmployeeId) {
    const employee = await UserModel.findById(headEmployeeId).select("_id");
    if (!employee) {
      throw new ApiError(404, "Employee not found");
    }
  }

  department.headEmployeeId = headEmployeeId as never;
  await department.save();
  await department.populate({ path: "headEmployeeId", select: "fullName employeeId" });
  await refreshDepartmentHeadsCache();

  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.DEPARTMENT_UPDATED,
    targetType: "Department",
    targetId: toId(department),
    metadata: { headEmployeeId },
  });

  return department;
}

export async function setDepartmentActive(
  actor: { id: string; employeeId: string },
  id: string,
  isActive: boolean
): Promise<IDepartment> {
  const department = await setReferenceDataActive(DepartmentModel, id, isActive, LABEL);
  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.DEPARTMENT_UPDATED,
    targetType: "Department",
    targetId: toId(department),
    metadata: { isActive },
  });
  return department;
}
