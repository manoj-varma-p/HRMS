"use client";

import { CalendarRange } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatWorkedHours } from "@/lib/format-ist";
import { MonthlySummaryReportRow, PaginationInfo } from "@/types/report.types";
import { ReportPagination } from "./report-pagination";
import { EmptyReportState } from "./empty-report-state";

const COLUMN_COUNT = 10;

export function MonthlySummaryTable({
  rows,
  isLoading,
  isError,
  pagination,
  onPageChange,
  onRowClick,
}: {
  rows: MonthlySummaryReportRow[];
  isLoading: boolean;
  isError: boolean;
  pagination?: PaginationInfo;
  onPageChange: (page: number) => void;
  onRowClick?: (row: MonthlySummaryReportRow) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>On Time</TableHead>
              <TableHead>Late</TableHead>
              <TableHead>Half Day</TableHead>
              <TableHead>Absent</TableHead>
              <TableHead>On Leave</TableHead>
              <TableHead>Holiday</TableHead>
              <TableHead>Missed Checkout</TableHead>
              <TableHead>Worked Hours</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {Array.from({ length: COLUMN_COUNT }).map((_, c) => (
                    <TableCell key={c}>
                      <Skeleton className="h-5 w-full max-w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading && isError && (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} className="h-32 text-center">
                  <p className="text-sm text-destructive">Couldn&apos;t load the monthly summary.</p>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !isError && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} className="h-40 text-center">
                  <EmptyReportState
                    icon={CalendarRange}
                    title="No employees found"
                    hint="Try adjusting the filters or search."
                  />
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              !isError &&
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={onRowClick ? "cursor-pointer hover:bg-muted/50" : undefined}
                  onClick={() => onRowClick?.(row)}
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{row.fullName}</span>
                      <span className="text-xs text-muted-foreground">{row.employeeId}</span>
                    </div>
                  </TableCell>
                  <TableCell>{row.department ?? "—"}</TableCell>
                  <TableCell>{row.summary.onTime}</TableCell>
                  <TableCell>{row.summary.late}</TableCell>
                  <TableCell>{row.summary.halfDay}</TableCell>
                  <TableCell>{row.summary.absent}</TableCell>
                  <TableCell>{row.summary.onLeave}</TableCell>
                  <TableCell>{row.summary.holiday}</TableCell>
                  <TableCell>{row.summary.missedCheckout}</TableCell>
                  <TableCell>{formatWorkedHours(row.summary.totalWorkedHours)}</TableCell>
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
