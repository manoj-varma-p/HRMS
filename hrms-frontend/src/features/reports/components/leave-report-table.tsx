"use client";

import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatISTDate } from "@/lib/format-ist";
import { LeaveReportRow, PaginationInfo } from "@/types/report.types";
import { ReportPagination } from "./report-pagination";
import { EmptyReportState } from "./empty-report-state";

const COLUMN_COUNT = 8;

const LEAVE_TYPE_LABELS: Record<string, string> = {
  SICK: "Sick",
  CASUAL_PAID: "Casual / Paid",
  UNPAID: "Unpaid",
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-transparent",
  APPROVED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent",
  REJECTED: "bg-red-500/10 text-red-600 dark:text-red-400 border-transparent",
  CANCELLED: "bg-muted text-muted-foreground border-transparent",
};

export function LeaveReportTable({
  rows,
  isLoading,
  isError,
  pagination,
  onPageChange,
}: {
  rows: LeaveReportRow[];
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
              <TableHead>Leave Type</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reviewed By</TableHead>
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
                  <p className="text-sm text-destructive">Couldn&apos;t load the leave report.</p>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !isError && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} className="h-40 text-center">
                  <EmptyReportState
                    icon={CalendarDays}
                    title="No leave requests found"
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
                  <TableCell>{LEAVE_TYPE_LABELS[row.leaveType]}</TableCell>
                  <TableCell>{formatISTDate(row.startDate)}</TableCell>
                  <TableCell>{formatISTDate(row.endDate)}</TableCell>
                  <TableCell>{row.days}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_BADGE[row.status]}>
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.reviewedBy ?? "—"}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <ReportPagination pagination={pagination} onPageChange={onPageChange} itemLabel="leave requests" />
      )}
    </div>
  );
}
