import { toId } from "../../shared/utils/toId";
import { escapeRegex } from "../../shared/utils/regex";
import { UserModel } from "../user/user.model";
import { DepartmentModel } from "../department/department.model";
import { DesignationModel } from "../designation/designation.model";

const RESULT_LIMIT = 5;

export async function globalSearch(query: string) {
  const regex = new RegExp(escapeRegex(query.trim()), "i");

  const [employees, departments, designations] = await Promise.all([
    UserModel.find({ $or: [{ fullName: regex }, { employeeId: regex }, { email: regex }] })
      .select("employeeId fullName email")
      .limit(RESULT_LIMIT),
    DepartmentModel.find({ name: regex }).select("name").limit(RESULT_LIMIT),
    DesignationModel.find({ name: regex }).select("name").limit(RESULT_LIMIT),
  ]);

  return {
    employees: employees.map((e) => ({
      id: toId(e),
      employeeId: e.employeeId,
      fullName: e.fullName,
      email: e.email,
    })),
    departments: departments.map((d) => ({ id: toId(d), name: d.name })),
    designations: designations.map((d) => ({ id: toId(d), name: d.name })),
  };
}
