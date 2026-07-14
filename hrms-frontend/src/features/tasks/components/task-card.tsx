import { AlertTriangle, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatISTDate } from "@/lib/format-ist";
import { Task } from "@/types/task.types";
import { TaskStatusBadge } from "./task-status-badge";
import { TaskPriorityBadge } from "./task-priority-badge";

export function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  return (
    <Card
      size="sm"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="cursor-pointer transition-colors hover:bg-accent/50"
    >
      <div className="flex flex-col gap-2 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-muted-foreground">{task.taskId}</span>
            <h3 className="font-medium leading-snug">{task.title}</h3>
          </div>
          <TaskPriorityBadge priority={task.priority} />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <TaskStatusBadge status={task.status} />
          <span>·</span>
          <span>Assigned by {task.assignedBy.fullName}</span>
          {task.dueDate && (
            <>
              <span>·</span>
              <span
                className={cn(
                  "flex items-center gap-1",
                  task.overdue && "font-medium text-destructive"
                )}
              >
                {task.overdue ? (
                  <AlertTriangle className="h-3.5 w-3.5" />
                ) : (
                  <Calendar className="h-3.5 w-3.5" />
                )}
                {task.overdue ? "Overdue: " : "Due "}
                {formatISTDate(task.dueDate)}
              </span>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
