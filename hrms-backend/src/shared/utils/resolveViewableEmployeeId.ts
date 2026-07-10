import { ApiError } from "../errors/ApiError";
import { UserModel } from "../../modules/user/user.model";

interface Actor {
  id: string;
  role: string;
}

/**
 * Shared by any module where an Employee may only see their own records
 * but Admin/Super Admin may look up another employee's via ?employeeId=.
 * Lives in shared/ (not attendance/) so both the attendance and leave
 * modules can depend on it without depending on each other.
 */
export async function resolveViewableEmployeeId(
  actor: Actor,
  requestedEmployeeId: string | undefined,
  deniedMessage = "You can only view your own records"
): Promise<string> {
  if (!requestedEmployeeId || requestedEmployeeId === actor.id) {
    return actor.id;
  }
  if (actor.role === "EMPLOYEE") {
    throw new ApiError(403, deniedMessage);
  }
  const exists = await UserModel.exists({ _id: requestedEmployeeId });
  if (!exists) {
    throw new ApiError(404, "Employee not found");
  }
  return requestedEmployeeId;
}
