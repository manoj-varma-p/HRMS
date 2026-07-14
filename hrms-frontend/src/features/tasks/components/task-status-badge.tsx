import { Badge } from "@/components/ui/badge";
import { TaskStatus } from "@/types/task.types";
import { TASK_STATUS_BADGE, TASK_STATUS_LABELS } from "../task-status-meta";
import { cn } from "@/lib/utils";

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge variant="outline" className={cn(TASK_STATUS_BADGE[status])}>
      {TASK_STATUS_LABELS[status]}
    </Badge>
  );
}
