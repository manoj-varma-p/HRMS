"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RoleGuard } from "@/components/layout/role-guard";
import { ROLES } from "@/constants/roles";
import * as reportService from "@/services/report.service";
import { ReportHeader } from "@/features/reports/components/report-header";
import { PrintButton } from "@/features/reports/components/print-button";
import { DateRangeFilter, DateRangeValue } from "@/features/reports/components/filters/date-range-filter";
import { DepartmentReportTable } from "@/features/reports/components/department-report-table";

export default function DepartmentReportPage() {
  return (
    <RoleGuard allow={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
      <DepartmentReportPageContent />
    </RoleGuard>
  );
}

function DepartmentReportPageContent() {
  const [range, setRange] = useState<DateRangeValue>({});

  const { data, isLoading, isError } = useQuery({
    queryKey: ["reports-departments", range],
    queryFn: () => reportService.getDepartmentReport(range).then((res) => res.data),
  });

  return (
    <div className="flex flex-col gap-6">
      <ReportHeader
        title="Department Report"
        description="Headcount and attendance performance broken down by department."
        actions={<PrintButton reportType="department" />}
      />

      <div className="print:hidden">
        <DateRangeFilter value={range} onChange={setRange} />
      </div>

      {data?.period && (
        <p className="text-sm text-muted-foreground">
          Attendance % is calculated over {data.period.workingDays} working day(s) from {data.period.start} to{" "}
          {data.period.end}.
        </p>
      )}

      <DepartmentReportTable rows={data?.rows ?? []} isLoading={isLoading} isError={isError} />
    </div>
  );
}
