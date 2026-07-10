import { Badge } from "@/components/ui/badge";
import { AnnouncementPriority } from "@/constants/announcement";
import { PRIORITY_BADGE, PRIORITY_LABELS } from "../announcement-meta";

export function PriorityBadge({ priority }: { priority: AnnouncementPriority }) {
  return (
    <Badge variant="outline" className={PRIORITY_BADGE[priority]}>
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}
