"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import * as attendanceService from "@/services/attendance.service";
import { AttendanceStatusBadge } from "@/features/attendance/components/attendance-status-badge";
import { formatISTDate, formatISTTime, formatWorkedHours } from "@/lib/format-ist";
import { ExportButton } from "./export-button";

const COLUMN_COUNT = 5;

export interface DailyDetailEmployee {
  id: string;
  employeeId: string;
  fullName: string;
}

export function EmployeeDailyDetailDialog({
  employee,
  year,
  month,
  onClose,
}: {
  employee: DailyDetailEmployee | null;
  year: number;
  month: number;
  onClose: () => void;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["employee-daily-detail", employee?.id, year, month],
    queryFn: () =>
      attendanceService.getHistory({ employeeId: employee!.id, year, month }).then((res) => res.data),
    enabled: employee !== null,
  });

  const exportMutation = useMutation({
    mutationFn: () =>
      attendanceService.exportHistoryCsv(
        { employeeId: employee!.id, year, month },
        `attendance-${employee!.employeeId}-${year}-${String(month).padStart(2, "0")}.csv`
      ),
    onSuccess: () => toast.success("Attendance history exported"),
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Sheet open={employee !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="flex flex-col overflow-hidden data-[side=right]:w-[75%] data-[side=right]:sm:max-w-[75%]"
      >
        {employee && (
          <>
            <SheetHeader>
              <div className="flex items-start justify-between gap-3 pr-8">
                <div>
                  <SheetTitle>{employee.fullName}</SheetTitle>
                  <SheetDescription>
                    {employee.employeeId} — daily attendance for{" "}
                    {new Date(year, month - 1, 1).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </SheetDescription>
                </div>
                <ExportButton onClick={() => exportMutation.mutate()} loading={exportMutation.isPending} />
              </div>
            </SheetHeader>

            <div className="mx-4 mb-4 flex-1 overflow-y-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Worked Hours</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading &&
                    Array.from({ length: 6 }).map((_, i) => (
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
                      <TableCell colSpan={COLUMN_COUNT} className="h-24 text-center">
                        <p className="text-sm text-destructive">Couldn&apos;t load daily attendance.</p>
                      </TableCell>
                    </TableRow>
                  )}

                  {!isLoading &&
                    !isError &&
                    data?.days.map((day) => (
                      <TableRow key={day.date}>
                        <TableCell>{formatISTDate(day.date)}</TableCell>
                        <TableCell>{formatISTTime(day.checkIn)}</TableCell>
                        <TableCell>{formatISTTime(day.checkOut)}</TableCell>
                        <TableCell>{formatWorkedHours(day.workedHours)}</TableCell>
                        <TableCell>
                          <AttendanceStatusBadge status={day.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
