import { ReferenceData } from "./employee.types";

// Department-specific — extends the generic ReferenceData (still used
// as-is by Designation) with the populated head, returned by the same
// GET /departments the generic reference-data service already calls.
export interface DepartmentWithHead extends ReferenceData {
  headEmployeeId: { _id: string; fullName: string; employeeId: string } | null;
}
