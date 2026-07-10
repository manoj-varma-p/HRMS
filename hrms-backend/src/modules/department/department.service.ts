import {
  createReferenceData,
  listReferenceData,
  setReferenceDataActive,
  updateReferenceData,
} from "../../shared/services/referenceData.service";
import { ACTIVITY_ACTIONS } from "../../shared/constants/activityActions";
import { recordActivity } from "../activity-log/activity-log.service";
import { DepartmentModel, IDepartment } from "./department.model";
import { toId } from "../../shared/utils/toId";

const LABEL = "Department";

export function listDepartments(includeInactive: boolean): Promise<IDepartment[]> {
  return listReferenceData(DepartmentModel, includeInactive);
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
