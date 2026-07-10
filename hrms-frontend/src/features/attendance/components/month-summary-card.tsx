"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import * as attendanceService from "@/services/attendance.service";
import { ATTENDANCE_STATUS_DOT, ATTENDANCE_STATUS_LABELS } from "../attendance-status-meta";

const SUMMARY_ROWS: { key: keyof import("@/types/attendance.types").MonthSummary; status: string }[] = [
  { key: "onTime", status: "ON_TIME" },
  { key: "late", status: "LATE" },
  { key: "halfDay", status: "HALF_DAY" },
  { key: "absent", status: "ABSENT" },
  { key: "onLeave", status: "ON_LEAVE" },
  { key: "missedCheckout", status: "MISSED_CHECKOUT" },
];

interface MonthSummaryCardProps {
  employeeId?: string;
  year?: number;
  month?: number;
}

export function MonthSummaryCard({ employeeId, year, month }: MonthSummaryCardProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["attendance-summary", employeeId, year, month],
    queryFn: () =>
      attendanceService.getSummary({ employeeId, year, month }).then((res) => res.data),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>This Month</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <div className="flex flex-col gap-2">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Total worked</span>
              <span className="text-xl font-semibold">
                {data?.summary.totalWorkedHours ?? 0}h
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {SUMMARY_ROWS.map(({ key, status }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span
                      className={`h-2 w-2 rounded-full ${ATTENDANCE_STATUS_DOT[status as keyof typeof ATTENDANCE_STATUS_DOT]}`}
                    />
                    {ATTENDANCE_STATUS_LABELS[status as keyof typeof ATTENDANCE_STATUS_LABELS]}
                  </span>
                  <span className="font-medium">{data?.summary[key] ?? 0}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
