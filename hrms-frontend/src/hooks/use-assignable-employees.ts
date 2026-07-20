import { useQuery } from "@tanstack/react-query";
import * as employeeService from "@/services/employee.service";

// Distinct from useEmployeeOptions() (which calls GET /employees, Admin/
// Super Admin only) — this backs AssigneePicker and TaskFilters' assignee
// dropdown, both of which a Department Head (a plain EMPLOYEE role) must
// also be able to use. GET /employees/assignable is open to any
// authenticated user and scopes its own response server-side.
export function useAssignableEmployees() {
  return useQuery({
    queryKey: ["assignable-employees"],
    queryFn: () => employeeService.listAssignableEmployees(),
  });
}
