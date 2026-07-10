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
import { LeaveReportFilters, LeaveReportFilterValues } from "@/features/reports/components/leave-report-filters";
import { LeaveReportTable } from "@/features/reports/components/leave-report-table";

const DEFAULT_FILTERS: LeaveReportFilterValues = { search: "" };

export default function LeaveReportPage() {
  return (
    <RoleGuard allow={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
      <LeaveReportPageContent />
    </RoleGuard>
  );
}

function LeaveReportPageContent() {
  const [filters, setFilters] = useState<LeaveReportFilterValues>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(filters.search);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["reports-leave", { ...filters, search: debouncedSearch, page }],
    queryFn: () =>
      reportService
        .getLeaveReport({ ...filters, search: debouncedSearch, page, limit: 20 })
        .then((res) => res.data),
  });

  const exportMutation = useMutation({
    mutationFn: () => reportService.exportLeaveReportCsv({ ...filters, search: debouncedSearch || undefined }),
    onSuccess: () => toast.success("Leave report exported"),
    onError: (err: Error) => toast.error(err.message),
  });

  function handleFiltersChange(next: LeaveReportFilterValues) {
    setFilters(next);
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-6">
      <ReportHeader
        title="Leave Report"
        description="Leave requests across all employees, with type, status, and review history."
        actions={
          <>
            <ExportButton onClick={() => exportMutation.mutate()} loading={exportMutation.isPending} />
            <PrintButton reportType="leave" />
          </>
        }
      />

      <LeaveReportFilters value={filters} onChange={handleFiltersChange} />

      <LeaveReportTable
        rows={data?.rows ?? []}
        isLoading={isLoading}
        isError={isError}
        pagination={data?.pagination}
        onPageChange={setPage}
      />
    </div>
  );
}
