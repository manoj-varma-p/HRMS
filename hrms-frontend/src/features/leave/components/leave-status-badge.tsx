import { Badge } from "@/components/ui/badge";
import { LeaveRequestStatus } from "@/constants/leave-types";
import { LEAVE_STATUS_BADGE, LEAVE_STATUS_LABELS } from "../leave-status-meta";
import { cn } from "@/lib/utils";

export function LeaveStatusBadge({ status }: { status: LeaveRequestStatus }) {
  return (
    <Badge variant="outline" className={cn(LEAVE_STATUS_BADGE[status])}>
      {LEAVE_STATUS_LABELS[status]}
    </Badge>
  );
}
