"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogIn, LogOut, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import * as attendanceService from "@/services/attendance.service";
import { formatISTTime, formatWorkedHours } from "@/lib/format-ist";
import { AttendanceStatusBadge } from "./attendance-status-badge";

function useLiveElapsed(checkIn: string | null, checkOut: string | null) {
  const [elapsedHours, setElapsedHours] = useState<number | null>(null);

  useEffect(() => {
    if (!checkIn || checkOut) {
      setElapsedHours(null);
      return;
    }
    function tick() {
      const ms = Date.now() - new Date(checkIn as string).getTime();
      setElapsedHours(ms / (1000 * 60 * 60));
    }
    tick();
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, [checkIn, checkOut]);

  return elapsedHours;
}

export function TodayStatusCard() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["attendance-today"],
    queryFn: () => attendanceService.getToday().then((res) => res.data.attendance),
  });

  const liveElapsed = useLiveElapsed(data?.checkIn ?? null, data?.checkOut ?? null);

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ["attendance-today"] });
    queryClient.invalidateQueries({ queryKey: ["attendance-calendar"] });
    queryClient.invalidateQueries({ queryKey: ["attendance-summary"] });
    queryClient.invalidateQueries({ queryKey: ["attendance-history"] });
  }

  const checkInMutation = useMutation({
    mutationFn: attendanceService.checkIn,
    onSuccess: () => {
      toast.success("Checked in");
      invalidateAll();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const checkOutMutation = useMutation({
    mutationFn: attendanceService.checkOut,
    onSuccess: () => {
      toast.success("Checked out");
      invalidateAll();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasCheckedIn = Boolean(data?.checkIn);
  const hasCheckedOut = Boolean(data?.checkOut);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Today</CardTitle>
        <AttendanceStatusBadge status={data?.status ?? null} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Check In</p>
            <p className="text-lg font-semibold">{formatISTTime(data?.checkIn ?? null)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Check Out</p>
            <p className="text-lg font-semibold">{formatISTTime(data?.checkOut ?? null)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {hasCheckedOut
            ? `Worked ${formatWorkedHours(data?.workedHours ?? null)}`
            : hasCheckedIn && liveElapsed !== null
              ? `${formatWorkedHours(liveElapsed)} so far`
              : "Not checked in yet"}
        </div>

        <div className="flex gap-2">
          <Button
            className="flex-1 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(0,0,0,0.2)] hover:bg-white dark:hover:bg-white hover:text-black dark:hover:text-black"
            disabled={hasCheckedIn || checkInMutation.isPending}
            onClick={() => checkInMutation.mutate()}
          >
            <LogIn className="h-4 w-4" />
            Check In
          </Button>
          <Button
            className="flex-1 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(0,0,0,0.2)] hover:bg-white hover:text-black dark:hover:bg-white dark:hover:text-black hover:border-transparent"
            variant="outline"
            disabled={!hasCheckedIn || hasCheckedOut || checkOutMutation.isPending}
            onClick={() => checkOutMutation.mutate()}
          >
            <LogOut className="h-4 w-4" />
            Check Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
