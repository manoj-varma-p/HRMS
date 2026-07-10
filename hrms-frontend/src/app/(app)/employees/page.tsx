"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { RoleGuard } from "@/components/layout/role-guard";
import { useAuth } from "@/hooks/use-auth";
import { ROLES } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import * as employeeService from "@/services/employee.service";
import { Employee } from "@/types/employee.types";
import {
  EmployeeFilters,
  EmployeeFilterValues,
} from "@/features/employees/components/employee-filters";
import { EmployeeTable } from "@/features/employees/components/employee-table";

const DEFAULT_FILTERS: EmployeeFilterValues = { search: "" };

export default function EmployeesPage() {
  return (
    <RoleGuard allow={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
      <EmployeesPageContent />
    </RoleGuard>
  );
}

function EmployeesPageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [filters, setFilters] = useState<EmployeeFilterValues>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pendingAction, setPendingAction] = useState<{
    employee: Employee;
    type: "activate" | "deactivate" | "delete";
  } | null>(null);

  const debouncedSearch = useDebouncedValue(filters.search);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["employees", { ...filters, search: debouncedSearch, page }],
    queryFn: () =>
      employeeService
        .listEmployees({ ...filters, search: debouncedSearch, page, limit: 10 })
        .then((res) => res.data),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => employeeService.activateEmployee(id),
    onSuccess: () => {
      toast.success("Employee activated");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setPendingAction(null);
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setPendingAction(null);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => employeeService.deactivateEmployee(id),
    onSuccess: () => {
      toast.success("Employee deactivated");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setPendingAction(null);
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setPendingAction(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeeService.deleteEmployee(id),
    onSuccess: () => {
      toast.success(`${pendingAction?.employee.fullName} was deleted`);
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setPendingAction(null);
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setPendingAction(null);
    },
  });

  // Mirrors the backend's rule: any Admin or Super Admin can delete an
  // Employee or Admin account — never a Super Admin, never their own.
  function canDeleteEmployee(employee: Employee): boolean {
    return !!user && user.id !== employee.id && employee.role !== ROLES.SUPER_ADMIN;
  }

  function handleFiltersChange(next: EmployeeFilterValues) {
    setFilters(next);
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="text-sm text-muted-foreground">
            Manage employee records, roles, and status.
          </p>
        </div>
        <Button onClick={() => router.push(ROUTES.EMPLOYEE_NEW)}>
          <Plus className="h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <EmployeeFilters value={filters} onChange={handleFiltersChange} />

      <EmployeeTable
        employees={data?.employees ?? []}
        isLoading={isLoading}
        isError={isError}
        pagination={data?.pagination}
        onPageChange={setPage}
        onView={(employee) => router.push(ROUTES.EMPLOYEE_DETAIL(employee.id))}
        onEdit={(employee) => router.push(ROUTES.EMPLOYEE_DETAIL(employee.id))}
        onActivate={(employee) => setPendingAction({ employee, type: "activate" })}
        onDeactivate={(employee) =>
          setPendingAction({ employee, type: "deactivate" })
        }
        onDelete={(employee) => setPendingAction({ employee, type: "delete" })}
        canDelete={canDeleteEmployee}
      />

      <ConfirmDialog
        open={pendingAction !== null}
        onOpenChange={(open) => !open && setPendingAction(null)}
        title={
          pendingAction?.type === "activate"
            ? "Activate employee?"
            : pendingAction?.type === "delete"
              ? "Delete employee?"
              : "Deactivate employee?"
        }
        description={
          pendingAction?.type === "activate"
            ? `${pendingAction.employee.fullName} will regain access to log in and use the system.`
            : pendingAction?.type === "delete"
              ? `This permanently removes ${pendingAction.employee.fullName}'s account and ALL of their attendance, leave, and correction history. This cannot be undone. If you want to keep their history, deactivate them instead.`
              : `${pendingAction?.employee.fullName} will no longer be able to log in.`
        }
        confirmLabel={
          pendingAction?.type === "activate"
            ? "Activate"
            : pendingAction?.type === "delete"
              ? "Delete"
              : "Deactivate"
        }
        destructive={pendingAction?.type === "deactivate" || pendingAction?.type === "delete"}
        isLoading={
          activateMutation.isPending || deactivateMutation.isPending || deleteMutation.isPending
        }
        onConfirm={() => {
          if (!pendingAction) return;
          if (pendingAction.type === "activate") {
            activateMutation.mutate(pendingAction.employee.id);
          } else if (pendingAction.type === "delete") {
            deleteMutation.mutate(pendingAction.employee.id);
          } else {
            deactivateMutation.mutate(pendingAction.employee.id);
          }
        }}
      />
    </div>
  );
}
