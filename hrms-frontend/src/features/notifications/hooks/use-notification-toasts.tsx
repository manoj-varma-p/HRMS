"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import * as notificationService from "@/services/notification.service";
import { cn } from "@/lib/utils";
import { NOTIFICATION_ICON, NOTIFICATION_ICON_COLOR } from "../notification-meta";

const POLL_INTERVAL_MS = 30_000;
const RECENT_UNREAD_LIMIT = 10;
// Longer than sonner's ~4s default — this fires from a background poll,
// not a direct action, so the user may not be looking at the screen the
// moment it appears. Paired with the explicit close button so an
// attentive user can still dismiss it immediately.
const TOAST_DURATION_MS = 15_000;

/**
 * Polls for unread notifications and toasts (with a close button) any that
 * are genuinely new since this hook started watching. Deliberately general
 * — it fires for any notification type, not just TASK_ASSIGNED/
 * TASK_REASSIGNED, since the underlying "tell me about new things
 * happening" need isn't task-specific, and the backend's listNotifications
 * has no type filter to narrow it anyway. No polling or toast-on-arrival
 * pattern existed anywhere in this app before this — mount once (in
 * AppShell) so it covers every authenticated page, not just while the
 * notification bell is open. Deliberately independent of NotificationBell's
 * own (unpolled) unread-count query — this doesn't change that component's
 * existing behavior at all.
 */
export function useNotificationToasts() {
  const seenIds = useRef<Set<string> | null>(null);

  const { data } = useQuery({
    queryKey: ["recent-unread-notifications"],
    queryFn: () =>
      notificationService
        .listNotifications({ unreadOnly: true, limit: RECENT_UNREAD_LIMIT })
        .then((res) => res.data.notifications),
    refetchInterval: POLL_INTERVAL_MS,
    // TanStack Query pauses refetchInterval when the tab loses focus by
    // default — the opposite of what a background notification watcher
    // needs (the whole point is to catch things that arrived while the
    // user was looking at something else).
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (!data) return;

    if (seenIds.current === null) {
      // First load: seed with whatever's already unread so existing,
      // un-acted-on notifications don't all toast at once on page load —
      // only notifications that arrive after this point are "new".
      seenIds.current = new Set(data.map((n) => n.id));
      return;
    }

    for (const notification of data) {
      if (seenIds.current.has(notification.id)) continue;
      seenIds.current.add(notification.id);

      const Icon = NOTIFICATION_ICON[notification.type];
      toast(notification.title, {
        description: notification.message,
        closeButton: true,
        duration: TOAST_DURATION_MS,
        icon: (
          <Icon className={cn("h-4 w-4", NOTIFICATION_ICON_COLOR[notification.type])} />
        ),
      });
    }
  }, [data]);
}
