"use client";

import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatISTDate } from "@/lib/format-ist";
import * as taskService from "@/services/task.service";
import { TASK_POLL_INTERVAL_MS } from "../task-status-meta";
import { TaskPriorityBadge } from "./task-priority-badge";
import { TaskRevisionIndicator } from "./task-revision-indicator";
import { TaskStatusSelector } from "./task-status-selector";
import { TaskCommentThread } from "./task-comment-thread";
import { TaskAttachmentPanel } from "./task-attachment-panel";

export function TaskDetailSheet({
  taskId,
  onOpenChange,
}: {
  taskId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    data: task,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => taskService.getTask(taskId as string),
    enabled: taskId !== null,
    // Only fires while enabled (i.e. while the sheet is actually open).
    refetchInterval: TASK_POLL_INTERVAL_MS,
  });

  return (
    <Sheet open={taskId !== null} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-hidden sm:max-w-lg">
        {isLoading && (
          <>
            <SheetHeader>
              <SheetTitle className="sr-only">Loading task</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-3 px-4 pb-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </div>
          </>
        )}

        {!isLoading && isError && (
          <>
            <SheetHeader>
              <SheetTitle className="sr-only">Task failed to load</SheetTitle>
            </SheetHeader>
            <p className="px-4 text-sm text-destructive">Couldn&apos;t load this task.</p>
          </>
        )}

        {!isLoading && !isError && task && (
          <>
            <SheetHeader>
              <span className="text-xs font-medium text-muted-foreground">{task.taskId}</span>
              <SheetTitle>{task.title}</SheetTitle>
            </SheetHeader>

            <div className="flex flex-col gap-5 overflow-y-auto px-4 pb-4">
              {task.description && (
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {task.description}
                </p>
              )}

              <div className="flex flex-col gap-2">
                <TaskStatusSelector task={task} />
                <TaskRevisionIndicator count={task.revisionCount} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Priority</span>
                  <TaskPriorityBadge priority={task.priority} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Due Date</span>
                  <span className={task.overdue ? "font-medium text-destructive" : undefined}>
                    {task.dueDate ? formatISTDate(task.dueDate) : "No due date"}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Assignee</span>
                  <span>{task.assignedTo.fullName}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Creator</span>
                  <span>{task.assignedBy.fullName}</span>
                </div>
              </div>

              <Separator />
              <TaskAttachmentPanel taskId={task.id} />
              <Separator />
              <TaskCommentThread taskId={task.id} />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
