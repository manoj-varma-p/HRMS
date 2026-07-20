"use client";

import { useNotificationToasts } from "../hooks/use-notification-toasts";

/** No UI — just runs useNotificationToasts() so AppShell (a server component) can mount it. */
export function NotificationToastListener() {
  useNotificationToasts();
  return null;
}
