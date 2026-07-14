import { useQuery } from "@tanstack/react-query";
import * as employeeService from "@/services/employee.service";

// Shared by every employee picker (Reports' EmployeeFilter, Department
// Head selection, and future Task Assignee selection) so they all read
// from one cached query instead of each duplicating this fetch under its
// own key.
export function useEmployeeOptions() {
  return useQuery({
    queryKey: ["employee-options"],
    queryFn: () =>
      employeeService
        .listEmployees({ limit: 100, sortBy: "fullName", sortOrder: "asc" })
        .then((res) => res.data.employees),
  });
}
