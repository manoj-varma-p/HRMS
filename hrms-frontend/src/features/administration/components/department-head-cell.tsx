"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as departmentService from "@/services/department.service";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import { ReferenceData } from "@/types/employee.types";

const NONE = "NONE";

// Rendered as the Departments page's extraColumn — see reference-data-manager.tsx.
// Fetches its own data (rather than reading off `item`, which is typed as
// the generic ReferenceData the shared table passes every extraColumn
// cell) so this stays entirely decoupled from the generic component.
export function DepartmentHeadCell({ department }: { department: ReferenceData }) {
  const queryClient = useQueryClient();

  const { data: departmentsWithHead } = useQuery({
    queryKey: ["departments-with-head"],
    queryFn: () => departmentService.listDepartmentsWithHead(true),
  });

  const { data: employees } = useEmployeeOptions();

  const currentHead =
    departmentsWithHead?.find((d) => d._id === department._id)?.headEmployeeId ?? null;

  const mutation = useMutation({
    mutationFn: (headEmployeeId: string | null) =>
      departmentService.setDepartmentHead(department._id, headEmployeeId),
    onSuccess: () => {
      toast.success("Department head updated");
      queryClient.invalidateQueries({ queryKey: ["departments-with-head"] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="flex items-center gap-2">
      <Select
        value={currentHead?._id ?? NONE}
        onValueChange={(v) => mutation.mutate(v === NONE ? null : v)}
        disabled={mutation.isPending}
      >
        <SelectTrigger className="w-48" aria-label={`Head of ${department.name}`}>
          <SelectValue placeholder="No head assigned">
            {(v: string) =>
              v === NONE ? "No head assigned" : employees?.find((e) => e.id === v)?.fullName
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>No head assigned</SelectItem>
          {employees?.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.fullName} ({e.employeeId})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
    </div>
  );
}
