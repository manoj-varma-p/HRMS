"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import * as announcementService from "@/services/announcement.service";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { ROUTES } from "@/constants/routes";
import { PriorityBadge } from "@/features/announcements/components/priority-badge";

export default function AnnouncementDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["announcement", params.id],
    queryFn: () => announcementService.getAnnouncement(params.id).then((res) => res.data.announcement),
  });

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit" onClick={() => router.push(ROUTES.ANNOUNCEMENTS)}>
        <ArrowLeft className="h-4 w-4" />
        Back to Announcements
      </Button>

      {isLoading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {!isLoading && isError && (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <Megaphone className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">Announcement not found</p>
          <p className="text-sm text-muted-foreground">
            It may have been archived or the link is incorrect.
          </p>
        </div>
      )}

      {!isLoading && !isError && data && (
        <div className="flex flex-col gap-4 rounded-xl border p-6">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{data.title}</h1>
            <PriorityBadge priority={data.priority} />
          </div>
          <span className="text-sm text-muted-foreground">
            {data.publishedAt
              ? `Published ${formatRelativeTime(data.publishedAt)}`
              : `Created ${formatRelativeTime(data.createdAt)}`}
            {data.expiryDate ? ` · Expires ${data.expiryDate}` : ""}
          </span>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{data.description}</p>
        </div>
      )}
    </div>
  );
}
