import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RecentActivityEntry } from "@/types/dashboard.types";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { formatActivityLabel } from "../activity-formatter";

interface ActivityTimelineProps {
  activities?: RecentActivityEntry[];
  isLoading?: boolean;
}

export function ActivityTimeline({ activities, isLoading }: ActivityTimelineProps) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-48 w-full" />}

        {!isLoading && (!activities || activities.length === 0) && (
          <p className="text-sm text-muted-foreground">No recent activity.</p>
        )}

        {!isLoading && activities && activities.length > 0 && (
          <ol className="flex flex-col">
            {activities.map((entry, index) => (
              <li key={entry.id} className="relative flex items-start gap-3 pb-4 last:pb-0">
                {index < activities.length - 1 && (
                  <div className="absolute top-3 left-0.75 h-full w-px bg-border" aria-hidden />
                )}
                <div className="relative mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary ring-4 ring-background" />
                <div className="flex flex-1 flex-col">
                  <span className="text-sm">{formatActivityLabel(entry)}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(entry.createdAt)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
