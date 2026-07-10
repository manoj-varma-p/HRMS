import {
  createReferenceData,
  listReferenceData,
  setReferenceDataActive,
  updateReferenceData,
} from "../../shared/services/referenceData.service";
import { ACTIVITY_ACTIONS } from "../../shared/constants/activityActions";
import { recordActivity } from "../activity-log/activity-log.service";
import { toId } from "../../shared/utils/toId";
import { DesignationModel, IDesignation } from "./designation.model";

const LABEL = "Designation";

export function listDesignations(includeInactive: boolean): Promise<IDesignation[]> {
  return listReferenceData(DesignationModel, includeInactive);
}

export async function createDesignation(
  actor: { id: string; employeeId: string },
  name: string
): Promise<IDesignation> {
  const designation = await createReferenceData(DesignationModel, name, LABEL);
  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.DESIGNATION_CREATED,
    targetType: "Designation",
    targetId: toId(designation),
    metadata: { name },
  });
  return designation;
}

export async function updateDesignation(
  actor: { id: string; employeeId: string },
  id: string,
  name: string
): Promise<IDesignation> {
  const designation = await updateReferenceData(DesignationModel, id, name, LABEL);
  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.DESIGNATION_UPDATED,
    targetType: "Designation",
    targetId: toId(designation),
    metadata: { name },
  });
  return designation;
}

export async function setDesignationActive(
  actor: { id: string; employeeId: string },
  id: string,
  isActive: boolean
): Promise<IDesignation> {
  const designation = await setReferenceDataActive(
    DesignationModel,
    id,
    isActive,
    LABEL
  );
  await recordActivity({
    actor,
    action: ACTIVITY_ACTIONS.DESIGNATION_UPDATED,
    targetType: "Designation",
    targetId: toId(designation),
    metadata: { isActive },
  });
  return designation;
}
