"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RoleGuard } from "@/components/layout/role-guard";
import { ROLES } from "@/constants/roles";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import * as reportService from "@/services/report.service";
import { ReportHeader } from "@/features/reports/components/report-header";
import { PrintButton } from "@/features/reports/components/print-button";
import {
  MonthlySummaryFilters,
  MonthlySummaryFilterValues,
} from "@/features/reports/components/monthly-summary-filters";
import { MonthlySummaryTable } from "@/features/reports/components/monthly-summary-table";

function currentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export default function MonthlySummaryReportPage() {
  return (
    <RoleGuard allow={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
      <MonthlySummaryReportPageContent />
    </RoleGuard>
  );
}

function MonthlySummaryReportPageContent() {
  const [filters, setFilters] = useState<MonthlySummaryFilterValues>({
    search: "",
    ...currentYearMonth(),
  });
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(filters.search);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["reports-monthly-summary", { ...filters, search: debouncedSearch, page }],
    queryFn: () =>
      reportService
        .getMonthlySummaryReport({ ...filters, search: debouncedSearch, page, limit: 20 })
        .then((res) => res.data),
  });

  function handleFiltersChange(next: MonthlySummaryFilterValues) {
    setFilters(next);
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-6">
      <ReportHeader
        title="Monthly Summary Report"
        description="Per-employee attendance summary for a selected month."
        actions={<PrintButton reportType="monthly-summary" />}
      />

      <MonthlySummaryFilters value={filters} onChange={handleFiltersChange} />

      <MonthlySummaryTable
        rows={data?.rows ?? []}
        isLoading={isLoading}
        isError={isError}
        pagination={data?.pagination}
        onPageChange={setPage}
      />
    </div>
  );
}
