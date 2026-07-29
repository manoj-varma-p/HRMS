"use client";

import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
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
  colorClass,
  isExtra = false,
}: {
  label: string;
  used: number;
  total: number | null;
  colorClass: string;
  isExtra?: boolean;
}) {
  const percent = total ? Math.min(100, (used / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className={`font-medium ${isExtra ? "text-emerald-700 dark:text-emerald-400" : ""}`}>
          {label}
        </span>
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

  const getBaseAndExtraUsage = (
    used: number,
    baseTotal: number | null,
    extra: number = 0
  ) => {
    if (baseTotal === null || extra === 0) {
      return { baseUsed: used, baseTotal, extraUsed: 0, extraTotal: extra };
    }
    const baseUsed = Math.min(used, baseTotal);
    const extraUsed = Math.max(0, used - baseTotal);
    return { baseUsed, baseTotal, extraUsed, extraTotal: extra };
  };

  const sickH1 = getBaseAndExtraUsage(
    data?.sick.half1.used ?? 0,
    data?.sick.half1.baseTotal ?? data?.sick.half1.total ?? null,
    data?.sick.half1.extra ?? 0
  );

  const sickH2 = getBaseAndExtraUsage(
    data?.sick.half2.used ?? 0,
    data?.sick.half2.baseTotal ?? data?.sick.half2.total ?? null,
    data?.sick.half2.extra ?? 0
  );

  const casualH1 = getBaseAndExtraUsage(
    data?.casualPaid.half1.used ?? 0,
    data?.casualPaid.half1.baseTotal ?? data?.casualPaid.half1.total ?? null,
    data?.casualPaid.half1.extra ?? 0
  );

  const casualH2 = getBaseAndExtraUsage(
    data?.casualPaid.half2.used ?? 0,
    data?.casualPaid.half2.baseTotal ?? data?.casualPaid.half2.total ?? null,
    data?.casualPaid.half2.extra ?? 0
  );

  const annualExtra = data?.annual.extra ?? 0;
  const annualBaseAccrued = data?.annual.baseAccrued ?? data?.annual.accrued ?? 0;
  const annualBaseUsed = Math.min(data?.annual.used ?? 0, annualBaseAccrued);
  const annualExtraUsed = Math.max(0, (data?.annual.used ?? 0) - annualBaseAccrued);

  const totalExtra =
    sickH1.extraTotal +
    sickH2.extraTotal +
    casualH1.extraTotal +
    casualH2.extraTotal +
    annualExtra;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Leave Balance</CardTitle>
        {totalExtra > 0 && (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 font-semibold text-xs gap-1">
            <Sparkles className="h-3 w-3" />
            {totalExtra} Additional Days Granted
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
              used={sickH1.baseUsed}
              total={sickH1.baseTotal}
              colorClass="bg-blue-500"
            />
            <BalanceRow
              label="Sick Leave (Jul–Dec)"
              used={sickH2.baseUsed}
              total={sickH2.baseTotal}
              colorClass="bg-blue-600"
            />
            <BalanceRow
              label="Casual Leave (Jan–Jun)"
              used={casualH1.baseUsed}
              total={casualH1.baseTotal}
              colorClass="bg-emerald-500"
            />
            <BalanceRow
              label="Casual Leave (Jul–Dec)"
              used={casualH2.baseUsed}
              total={casualH2.baseTotal}
              colorClass="bg-emerald-600"
            />
            <BalanceRow
              label="Annual Leave"
              used={annualBaseUsed}
              total={annualBaseAccrued}
              colorClass="bg-violet-500"
            />
            <BalanceRow
              label="Unpaid Leave"
              used={data?.unpaid.used ?? 0}
              total={null}
              colorClass="bg-muted-foreground"
            />

            {totalExtra > 0 && (
              <div className="mt-2 pt-4 border-t flex flex-col gap-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  Additional Leaves
                </div>

                {sickH1.extraTotal > 0 && (
                  <BalanceRow
                    label="Additional Sick Leave (Jan–Jun)"
                    used={sickH1.extraUsed}
                    total={sickH1.extraTotal}
                    colorClass="bg-amber-500"
                    isExtra
                  />
                )}
                {sickH2.extraTotal > 0 && (
                  <BalanceRow
                    label="Additional Sick Leave (Jul–Dec)"
                    used={sickH2.extraUsed}
                    total={sickH2.extraTotal}
                    colorClass="bg-amber-500"
                    isExtra
                  />
                )}
                {casualH1.extraTotal > 0 && (
                  <BalanceRow
                    label="Additional Casual Leave (Jan–Jun)"
                    used={casualH1.extraUsed}
                    total={casualH1.extraTotal}
                    colorClass="bg-amber-500"
                    isExtra
                  />
                )}
                {casualH2.extraTotal > 0 && (
                  <BalanceRow
                    label="Additional Casual Leave (Jul–Dec)"
                    used={casualH2.extraUsed}
                    total={casualH2.extraTotal}
                    colorClass="bg-amber-500"
                    isExtra
                  />
                )}
                {annualExtra > 0 && (
                  <BalanceRow
                    label="Additional Annual Leave"
                    used={annualExtraUsed}
                    total={annualExtra}
                    colorClass="bg-amber-500"
                    isExtra
                  />
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
