import { Badge } from "@/components/ui/badge";
import { AttendanceStatus } from "@/constants/attendance-status";
import { ATTENDANCE_STATUS_BADGE, ATTENDANCE_STATUS_LABELS } from "../attendance-status-meta";
import { cn } from "@/lib/utils";

export function AttendanceStatusBadge({
  status,
}: {
  status: AttendanceStatus | null;
}) {
  if (!status) {
    return (
      <Badge variant="outline" className="border-dashed text-muted-foreground">
        Not yet determined
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={cn(ATTENDANCE_STATUS_BADGE[status])}>
      {ATTENDANCE_STATUS_LABELS[status]}
    </Badge>
  );
}
