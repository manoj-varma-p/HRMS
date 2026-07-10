"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import * as announcementService from "@/services/announcement.service";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { PriorityBadge } from "./priority-badge";

export function RecentAnnouncementsWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["announcements-recent"],
    queryFn: () => announcementService.getRecentAnnouncements().then((res) => res.data.announcements),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Announcements</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isLoading && <Skeleton className="h-32 w-full" />}

        {!isLoading && (data?.length ?? 0) === 0 && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Megaphone className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No announcements yet.</p>
          </div>
        )}

        {!isLoading &&
          data?.map((a) => (
            <Link
              key={a.id}
              href={ROUTES.ANNOUNCEMENT_DETAIL(a.id)}
              className="flex flex-col gap-1 rounded-md p-2 -mx-2 transition-colors hover:bg-accent"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{a.title}</span>
                <PriorityBadge priority={a.priority} />
              </div>
              <span className="text-xs text-muted-foreground">
                {a.publishedAt ? formatRelativeTime(a.publishedAt) : formatRelativeTime(a.createdAt)}
              </span>
            </Link>
          ))}

        {!isLoading && (data?.length ?? 0) > 0 && (
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href={ROUTES.ANNOUNCEMENTS} />}>
            View All Announcements
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
