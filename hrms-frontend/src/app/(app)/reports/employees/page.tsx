"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { RoleGuard } from "@/components/layout/role-guard";
import { ROLES } from "@/constants/roles";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import * as reportService from "@/services/report.service";
import { ReportHeader } from "@/features/reports/components/report-header";
import { ExportButton } from "@/features/reports/components/export-button";
import { PrintButton } from "@/features/reports/components/print-button";
import {
  EmployeeReportFilters,
  EmployeeReportFilterValues,
} from "@/features/reports/components/employee-report-filters";
import { EmployeeReportTable } from "@/features/reports/components/employee-report-table";

const DEFAULT_FILTERS: EmployeeReportFilterValues = { search: "" };

export default function EmployeeReportPage() {
  return (
    <RoleGuard allow={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
      <EmployeeReportPageContent />
    </RoleGuard>
  );
}

function EmployeeReportPageContent() {
  const [filters, setFilters] = useState<EmployeeReportFilterValues>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(filters.search);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["reports-employees", { ...filters, search: debouncedSearch, page }],
    queryFn: () =>
      reportService
        .getEmployeeReport({ ...filters, search: debouncedSearch, page, limit: 20 })
        .then((res) => res.data),
  });

  const exportMutation = useMutation({
    mutationFn: () =>
      reportService.exportEmployeeReportCsv({ ...filters, search: debouncedSearch || undefined }),
    onSuccess: () => toast.success("Employee report exported"),
    onError: (err: Error) => toast.error(err.message),
  });

  function handleFiltersChange(next: EmployeeReportFilterValues) {
    setFilters(next);
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-6">
      <ReportHeader
        title="Employee Report"
        description="Employee directory with attendance and leave usage for the selected period."
        actions={
          <>
            <ExportButton onClick={() => exportMutation.mutate()} loading={exportMutation.isPending} />
            <PrintButton reportType="employee" />
          </>
        }
      />

      <EmployeeReportFilters value={filters} onChange={handleFiltersChange} />

      {data?.period && (
        <p className="text-sm text-muted-foreground print:hidden">
          Present/leave counts shown for {data.period.start} to {data.period.end}.
        </p>
      )}

      <EmployeeReportTable
        rows={data?.rows ?? []}
        isLoading={isLoading}
        isError={isError}
        pagination={data?.pagination}
        onPageChange={setPage}
      />
    </div>
  );
}
