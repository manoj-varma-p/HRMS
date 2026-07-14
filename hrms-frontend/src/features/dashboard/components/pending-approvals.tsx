"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/constants/routes";
import * as leaveService from "@/services/leave.service";
import * as correctionService from "@/services/attendance-correction.service";
import { LEAVE_TYPE_LABELS } from "@/features/leave/leave-status-meta";
import { formatISTDate } from "@/lib/format-ist";

export function PendingApprovals() {
  const queryClient = useQueryClient();

  const { data: leaves, isLoading: leavesLoading } = useQuery({
    queryKey: ["admin-leaves", "pending-preview"],
    queryFn: () =>
      leaveService.adminListLeaves({ status: "PENDING", limit: 3 }).then((res) => res.data.leaves),
  });

  const { data: corrections, isLoading: correctionsLoading } = useQuery({
    queryKey: ["admin-corrections", "pending-preview"],
    queryFn: () =>
      correctionService
        .adminListCorrections({ status: "PENDING", limit: 3 })
        .then((res) => res.data.corrections),
  });

  const approveLeaveMutation = useMutation({
    mutationFn: (id: string) => leaveService.approveLeave(id),
    onSuccess: () => {
      toast.success("Leave approved");
      queryClient.invalidateQueries({ queryKey: ["admin-leaves"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const isLoading = leavesLoading || correctionsLoading;
  const isEmpty = !isLoading && (leaves?.length ?? 0) === 0 && (corrections?.length ?? 0) === 0;

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Pending Approvals</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading && <Skeleton className="h-32 w-full" />}

        {isEmpty && <p className="text-sm text-muted-foreground">Nothing pending. All caught up.</p>}

        {!isLoading && (leaves?.length ?? 0) > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">Leave Requests</p>
            {leaves!.map((leave) => {
              const employee = typeof leave.employee === "object" ? leave.employee : null;
              return (
                <div key={leave.id} className="flex items-center justify-between gap-3 text-sm">
                  <span>
                    {employee?.fullName ?? "—"} · {LEAVE_TYPE_LABELS[leave.leaveType]} ·{" "}
                    {formatISTDate(leave.startDate)}
                  </span>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => approveLeaveMutation.mutate(leave.id)}
                    aria-label="Quick approve"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && (corrections?.length ?? 0) > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">Attendance Corrections</p>
            {corrections!.map((c) => {
              const employee = typeof c.employee === "object" ? c.employee : null;
              return (
                <div key={c.id} className="flex items-center justify-between gap-3 text-sm">
                  <span>
                    {employee?.fullName ?? "—"} · {formatISTDate(c.date)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex gap-2 border-t pt-3">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={ROUTES.LEAVE_ADMIN} />}
          >
            View Leave Requests
          </Button>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={ROUTES.ATTENDANCE_TEAM} />}
          >
            View Attendance
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
