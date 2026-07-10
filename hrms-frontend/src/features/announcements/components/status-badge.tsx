import { Badge } from "@/components/ui/badge";
import { AnnouncementStatus } from "@/constants/announcement";
import { STATUS_BADGE, STATUS_LABELS } from "../announcement-meta";

export function AnnouncementStatusBadge({ status }: { status: AnnouncementStatus }) {
  return (
    <Badge variant="outline" className={STATUS_BADGE[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
