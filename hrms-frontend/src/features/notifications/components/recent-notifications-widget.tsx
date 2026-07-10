"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import * as notificationService from "@/services/notification.service";
import { NotificationCard } from "./notification-card";

export function RecentNotificationsWidget() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications-recent-widget"],
    queryFn: () => notificationService.listNotifications({ page: 1, limit: 5 }).then((res) => res.data),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-recent-widget"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Notifications</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {isLoading && <Skeleton className="h-32 w-full" />}

        {!isLoading && (data?.notifications.length ?? 0) === 0 && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <BellOff className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No notifications yet.</p>
          </div>
        )}

        {!isLoading &&
          data?.notifications.map((n) => (
            <NotificationCard key={n.id} notification={n} onMarkRead={(id) => markReadMutation.mutate(id)} />
          ))}
      </CardContent>
    </Card>
  );
}
