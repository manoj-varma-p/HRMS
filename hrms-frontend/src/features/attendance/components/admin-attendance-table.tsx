"use client";

import { ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminAttendanceRow, PaginationInfo } from "@/types/attendance.types";
import { formatISTDate, formatISTTime, formatWorkedHours } from "@/lib/format-ist";
import { AttendanceStatusBadge } from "./attendance-status-badge";

interface AdminAttendanceTableProps {
  rows: AdminAttendanceRow[];
  isLoading: boolean;
  isError: boolean;
  pagination?: PaginationInfo;
  onPageChange: (page: number) => void;
}

const COLUMN_COUNT = 7;

export function AdminAttendanceTable({
  rows,
  isLoading,
  isError,
  pagination,
  onPageChange,
}: AdminAttendanceTableProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
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
                  <p className="text-sm text-destructive">
                    Couldn&apos;t load attendance records.
                  </p>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !isError && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <ClipboardList className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">No attendance records found</p>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting the filters or selected period.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              !isError &&
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{row.employee.fullName}</span>
                      <span className="text-xs text-muted-foreground">
                        {row.employee.employeeId}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{row.department ?? "—"}</TableCell>
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

      {pagination && pagination.total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} records
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
