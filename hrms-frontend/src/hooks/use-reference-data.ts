import { useQuery } from "@tanstack/react-query";
import { departmentService } from "@/services/department.service";
import { designationService } from "@/services/designation.service";

export function useDepartments(includeInactive = false) {
  return useQuery({
    queryKey: ["departments", includeInactive],
    queryFn: () => departmentService.list(includeInactive),
  });
}

export function useDesignations(includeInactive = false) {
  return useQuery({
    queryKey: ["designations", includeInactive],
    queryFn: () => designationService.list(includeInactive),
  });
}
