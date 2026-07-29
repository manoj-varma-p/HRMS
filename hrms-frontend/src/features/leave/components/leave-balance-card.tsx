"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import * as leaveService from "@/services/leave.service";

interface LeaveBalanceCardProps {
  employeeId?: string;
}

function BalanceRow({
  label,
  used,
  total,
  extra,
  colorClass,
}: {
  label: string;
  used: number;
  total: number | null;
  extra?: number;
  colorClass: string;
}) {
  const percent = total ? Math.min(100, (used / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <div className="flex items-center gap-1.5">
          <span className="font-medium">{label}</span>
          {extra && extra > 0 ? (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-normal">
              +{extra} additional
            </Badge>
          ) : null}
        </div>
        <span className="text-muted-foreground">
          {total === null ? "Unlimited" : `${used} / ${total}`}
        </span>
      </div>
      {total !== null && <Progress value={percent} indicatorClassName={colorClass} />}
    </div>
  );
}

export function LeaveBalanceCard({ employeeId }: LeaveBalanceCardProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["leave-balance", employeeId],
    queryFn: () => leaveService.getBalance({ employeeId }).then((res) => res.data),
  });

  const totalExtra =
    (data?.sick.half1.extra ?? 0) +
    (data?.sick.half2.extra ?? 0) +
    (data?.casualPaid.half1.extra ?? 0) +
    (data?.casualPaid.half2.extra ?? 0) +
    (data?.annual.extra ?? 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Leave Balance</CardTitle>
        {totalExtra > 0 && (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 font-semibold text-xs">
            +{totalExtra} Additional Days Granted
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-4">
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <>
            <BalanceRow
              label="Sick Leave (Jan–Jun)"
              used={data?.sick.half1.used ?? 0}
              total={data?.sick.half1.total ?? null}
              extra={data?.sick.half1.extra}
              colorClass="bg-blue-500"
            />
            <BalanceRow
              label="Sick Leave (Jul–Dec)"
              used={data?.sick.half2.used ?? 0}
              total={data?.sick.half2.total ?? null}
              extra={data?.sick.half2.extra}
              colorClass="bg-blue-600"
            />
            <BalanceRow
              label="Casual Leave (Jan–Jun)"
              used={data?.casualPaid.half1.used ?? 0}
              total={data?.casualPaid.half1.total ?? null}
              extra={data?.casualPaid.half1.extra}
              colorClass="bg-emerald-500"
            />
            <BalanceRow
              label="Casual Leave (Jul–Dec)"
              used={data?.casualPaid.half2.used ?? 0}
              total={data?.casualPaid.half2.total ?? null}
              extra={data?.casualPaid.half2.extra}
              colorClass="bg-emerald-600"
            />
            <BalanceRow
              label="Annual Leave"
              used={data?.annual.used ?? 0}
              total={data?.annual.accrued ?? 0}
              extra={data?.annual.extra}
              colorClass="bg-violet-500"
            />
            <BalanceRow
              label="Unpaid Leave"
              used={data?.unpaid.used ?? 0}
              total={null}
              colorClass="bg-muted-foreground"
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
