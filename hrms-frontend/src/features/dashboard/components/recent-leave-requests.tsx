"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import * as leaveService from "@/services/leave.service";
import { LEAVE_TYPE_LABELS } from "@/features/leave/leave-status-meta";
import { LeaveStatusBadge } from "@/features/leave/components/leave-status-badge";
import { formatISTDate } from "@/lib/format-ist";

export function RecentLeaveRequests() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-leaves", "recent"],
    queryFn: () => leaveService.myLeaves({ limit: 5 }).then((res) => res.data.leaves),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Leave Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-24 w-full" />}

        {!isLoading && (!data || data.length === 0) && (
          <p className="text-sm text-muted-foreground">No leave requests yet.</p>
        )}

        {!isLoading && data && data.length > 0 && (
          <div className="flex flex-col divide-y">
            {data.map((leave) => (
              <div
                key={leave.id}
                className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {LEAVE_TYPE_LABELS[leave.leaveType]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatISTDate(leave.startDate)} – {formatISTDate(leave.endDate)}
                  </span>
                </div>
                <LeaveStatusBadge status={leave.status} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
