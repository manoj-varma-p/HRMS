"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import * as attendanceService from "@/services/attendance.service";
import { DayStatusEntry } from "@/types/attendance.types";
import { ATTENDANCE_STATUS_DOT, ATTENDANCE_STATUS_LABELS } from "../attendance-status-meta";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const LEGEND_STATUSES: (keyof typeof ATTENDANCE_STATUS_DOT)[] = [
  "ON_TIME",
  "LATE",
  "HALF_DAY",
  "ABSENT",
  "ON_LEAVE",
  "HOLIDAY",
  "WEEKEND",
  "MISSED_CHECKOUT",
];

function dayOfWeek(dateStr: string): number {
  return new Date(`${dateStr}T12:00:00+05:30`).getDay();
}

function isToday(dateStr: string): boolean {
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  return dateStr === todayStr;
}

interface AttendanceCalendarProps {
  employeeId?: string;
  onDayClick: (day: DayStatusEntry) => void;
}

export function AttendanceCalendar({ employeeId, onDayClick }: AttendanceCalendarProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data, isLoading } = useQuery({
    queryKey: ["attendance-calendar", employeeId, year, month],
    queryFn: () =>
      attendanceService.getCalendar({ employeeId, year, month }).then((res) => res.data.days),
  });

  const leadingBlanks = useMemo(() => {
    if (!data || data.length === 0) return 0;
    return dayOfWeek(data[0].date);
  }, [data]);

  function goPrev() {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goNext() {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>{monthLabel}</CardTitle>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={goPrev} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goNext} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading ? (
          <Skeleton className="h-80 w-full" />
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-muted-foreground">
              {WEEKDAY_LABELS.map((w) => (
                <div key={w}>{w}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: leadingBlanks }).map((_, i) => (
                <div key={`blank-${i}`} />
              ))}
              {data?.map((day) => {
                const dayNum = Number(day.date.slice(-2));
                return (
                  <button
                    key={day.date}
                    onClick={() => onDayClick(day)}
                    className={cn(
                      "flex aspect-square flex-col items-center justify-center gap-1 rounded-md border text-sm transition-colors hover:bg-accent",
                      isToday(day.date) && "border-primary"
                    )}
                  >
                    <span>{dayNum}</span>
                    {day.status && (
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          ATTENDANCE_STATUS_DOT[day.status]
                        )}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t pt-3 text-xs text-muted-foreground">
              {LEGEND_STATUSES.map((status) => (
                <span key={status} className="flex items-center gap-1.5">
                  <span className={cn("h-2 w-2 rounded-full", ATTENDANCE_STATUS_DOT[status])} />
                  {ATTENDANCE_STATUS_LABELS[status]}
                </span>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
