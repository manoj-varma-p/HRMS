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
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-48 w-full" />}

        {!isLoading && (!activities || activities.length === 0) && (
          <p className="text-sm text-muted-foreground">No recent activity.</p>
        )}

        {!isLoading && activities && activities.length > 0 && (
          <ol className="flex flex-col gap-4">
            {activities.map((entry) => (
              <li key={entry.id} className="flex items-start gap-3">
                <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
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
