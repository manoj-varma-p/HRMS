"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import * as correctionService from "@/services/attendance-correction.service";
import { formatISTDate } from "@/lib/format-ist";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-transparent",
  APPROVED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent",
  REJECTED: "bg-red-500/10 text-red-600 dark:text-red-400 border-transparent",
};

export function MyCorrectionsList() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-corrections"],
    queryFn: () =>
      correctionService.myCorrections({ limit: 5 }).then((res) => res.data.corrections),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Correction Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-24 w-full" />}

        {!isLoading && (!data || data.length === 0) && (
          <p className="text-sm text-muted-foreground">No correction requests yet.</p>
        )}

        {!isLoading && data && data.length > 0 && (
          <div className="flex flex-col gap-3">
            {data.map((c) => (
              <div key={c.id} className="flex items-start justify-between gap-3 text-sm">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{formatISTDate(c.date)}</span>
                  <span className="text-muted-foreground">{c.reason}</span>
                  {c.reviewComment && (
                    <span className="text-xs text-muted-foreground">
                      Admin: {c.reviewComment}
                    </span>
                  )}
                </div>
                <Badge variant="outline" className={STATUS_STYLES[c.status]}>
                  {c.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
