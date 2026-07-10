import { formatRelativeTime } from "@/lib/format-relative-time";
import { Announcement } from "@/types/announcement.types";
import { PriorityBadge } from "./priority-badge";
import { AnnouncementStatusBadge } from "./status-badge";

export function AnnouncementCard({
  announcement,
  showStatus = false,
  actions,
  truncate = true,
}: {
  announcement: Announcement;
  showStatus?: boolean;
  actions?: React.ReactNode;
  truncate?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium">{announcement.title}</h3>
            <PriorityBadge priority={announcement.priority} />
            {showStatus && <AnnouncementStatusBadge status={announcement.status} />}
          </div>
          <p className={truncate ? "line-clamp-2 text-sm text-muted-foreground" : "text-sm text-muted-foreground"}>
            {announcement.description}
          </p>
          <span className="text-xs text-muted-foreground">
            {announcement.publishedAt
              ? `Published ${formatRelativeTime(announcement.publishedAt)}`
              : `Created ${formatRelativeTime(announcement.createdAt)}`}
            {announcement.expiryDate ? ` · Expires ${announcement.expiryDate}` : ""}
          </span>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      </div>
    </div>
  );
}
