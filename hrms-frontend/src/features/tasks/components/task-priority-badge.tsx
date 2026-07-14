import { Badge } from "@/components/ui/badge";
import { TaskPriority } from "@/types/task.types";
import { TASK_PRIORITY_BADGE, TASK_PRIORITY_LABELS } from "../task-status-meta";
import { cn } from "@/lib/utils";

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <Badge variant="outline" className={cn(TASK_PRIORITY_BADGE[priority])}>
      {TASK_PRIORITY_LABELS[priority]}
    </Badge>
  );
}
