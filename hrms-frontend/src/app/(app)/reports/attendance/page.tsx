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
  AttendanceReportFilters,
  AttendanceReportFilterValues,
} from "@/features/reports/components/attendance-report-filters";
import { AttendanceReportTable } from "@/features/reports/components/attendance-report-table";

const DEFAULT_FILTERS: AttendanceReportFilterValues = { search: "" };

export default function AttendanceReportPage() {
  return (
    <RoleGuard allow={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
      <AttendanceReportPageContent />
    </RoleGuard>
  );
}

function AttendanceReportPageContent() {
  const [filters, setFilters] = useState<AttendanceReportFilterValues>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(filters.search);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["reports-attendance", { ...filters, search: debouncedSearch, page }],
    queryFn: () =>
      reportService
        .getAttendanceReport({ ...filters, search: debouncedSearch, page, limit: 20 })
        .then((res) => res.data),
  });

  const exportMutation = useMutation({
    mutationFn: () =>
      reportService.exportAttendanceReportCsv({ ...filters, search: debouncedSearch || undefined }),
    onSuccess: () => toast.success("Attendance report exported"),
    onError: (err: Error) => toast.error(err.message),
  });

  function handleFiltersChange(next: AttendanceReportFilterValues) {
    setFilters(next);
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-6">
      <ReportHeader
        title="Attendance Report"
        description="Daily check-in, check-out, and status records across all employees."
        actions={
          <>
            <ExportButton onClick={() => exportMutation.mutate()} loading={exportMutation.isPending} />
            <PrintButton reportType="attendance" />
          </>
        }
      />

      <AttendanceReportFilters value={filters} onChange={handleFiltersChange} />

      <AttendanceReportTable
        rows={data?.rows ?? []}
        isLoading={isLoading}
        isError={isError}
        pagination={data?.pagination}
        onPageChange={setPage}
      />
    </div>
  );
}
