"use client";

import { ClipboardList } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AttendanceStatusBadge } from "@/features/attendance/components/attendance-status-badge";
import { formatISTDate, formatISTTime, formatWorkedHours } from "@/lib/format-ist";
import { AttendanceReportRow, PaginationInfo } from "@/types/report.types";
import { ReportPagination } from "./report-pagination";
import { EmptyReportState } from "./empty-report-state";

const COLUMN_COUNT = 8;

export function AttendanceReportTable({
  rows,
  isLoading,
  isError,
  pagination,
  onPageChange,
}: {
  rows: AttendanceReportRow[];
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
              <TableHead>Date</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead>Worked Hours</TableHead>
              <TableHead>Status</TableHead>
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
                  <p className="text-sm text-destructive">Couldn&apos;t load the attendance report.</p>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !isError && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} className="h-40 text-center">
                  <EmptyReportState
                    icon={ClipboardList}
                    title="No attendance records found"
                    hint="Try adjusting the filters or selected period."
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
                      <span className="text-xs text-muted-foreground">{row.employeeId}</span>
                    </div>
                  </TableCell>
                  <TableCell>{row.department ?? "—"}</TableCell>
                  <TableCell>{row.designation ?? "—"}</TableCell>
                  <TableCell>{formatISTDate(row.date)}</TableCell>
                  <TableCell>{formatISTTime(row.checkIn)}</TableCell>
                  <TableCell>{formatISTTime(row.checkOut)}</TableCell>
                  <TableCell>{formatWorkedHours(row.workedHours)}</TableCell>
                  <TableCell>
                    <AttendanceStatusBadge status={row.status} />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <ReportPagination pagination={pagination} onPageChange={onPageChange} itemLabel="records" />
      )}
    </div>
  );
}
