"use client";

import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmployeeReportRow, PaginationInfo } from "@/types/report.types";
import { ReportPagination } from "./report-pagination";
import { EmptyReportState } from "./empty-report-state";

const COLUMN_COUNT = 8;

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent",
  INACTIVE: "bg-muted text-muted-foreground border-transparent",
  NOTICE_PERIOD: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-transparent",
  RESIGNED: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-transparent",
  TERMINATED: "bg-red-500/10 text-red-600 dark:text-red-400 border-transparent",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  NOTICE_PERIOD: "Notice Period",
  RESIGNED: "Resigned",
  TERMINATED: "Terminated",
};

export function EmployeeReportTable({
  rows,
  isLoading,
  isError,
  pagination,
  onPageChange,
}: {
  rows: EmployeeReportRow[];
  isLoading: boolean;
  isError: boolean;
  pagination?: PaginationInfo;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joining Date</TableHead>
              <TableHead>Present Days</TableHead>
              <TableHead>Leave Days</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {Array.from({ length: COLUMN_COUNT }).map((_, c) => (
                    <TableCell key={c}>
                      <Skeleton className="h-5 w-full max-w-28" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading && isError && (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} className="h-32 text-center">
                  <p className="text-sm text-destructive">Couldn&apos;t load the employee report.</p>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !isError && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} className="h-40 text-center">
                  <EmptyReportState
                    icon={Users}
                    title="No employees found"
                    hint="Try adjusting the filters or search."
                  />
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              !isError &&
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{row.fullName}</span>
                      <span className="text-xs text-muted-foreground">
                        {row.employeeId} · {row.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{row.department ?? "—"}</TableCell>
                  <TableCell>{row.designation ?? "—"}</TableCell>
                  <TableCell>{row.role}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_BADGE[row.status]}>
                      {STATUS_LABELS[row.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(row.joiningDate).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell>{row.presentDays}</TableCell>
                  <TableCell>{row.leaveDays}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <ReportPagination pagination={pagination} onPageChange={onPageChange} itemLabel="employees" />
      )}
    </div>
  );
}
