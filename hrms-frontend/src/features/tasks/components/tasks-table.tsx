"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ClipboardList, Pencil, Repeat, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatISTDate } from "@/lib/format-ist";
import * as taskService from "@/services/task.service";
import { PaginationInfo, Task } from "@/types/task.types";
import { TaskStatusBadge } from "./task-status-badge";
import { TaskPriorityBadge } from "./task-priority-badge";
import { TaskRevisionIndicator } from "./task-revision-indicator";
import { TaskFormDialog } from "./task-form-dialog";
import { TaskReassignDialog } from "./task-reassign-dialog";

const COLUMN_COUNT_ADMIN = 7;
const COLUMN_COUNT_TEAM = 6;

interface TasksTableProps {
  /** "admin" shows the Department column; "team" omits it (implicit to the viewer's own department(s)). */
  scope: "team" | "admin";
  tasks: Task[];
  isLoading: boolean;
  isError: boolean;
  pagination?: PaginationInfo;
  onPageChange: (page: number) => void;
  onViewDetail: (taskId: string) => void;
}

// Owns its own row-action dialogs (edit/reassign/cancel), matching
// AdminLeaveTable's precedent — the page that renders this table stays
// thin (fetch + filters + pagination only), it doesn't manage per-row
// dialog state itself.
export function TasksTable({
  scope,
  tasks,
  isLoading,
  isError,
  pagination,
  onPageChange,
  onViewDetail,
}: TasksTableProps) {
  const queryClient = useQueryClient();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [reassigningTask, setReassigningTask] = useState<Task | null>(null);
  const [cancellingTask, setCancellingTask] = useState<Task | null>(null);
  const columnCount = scope === "admin" ? COLUMN_COUNT_ADMIN : COLUMN_COUNT_TEAM;

  const invalidateLists = () => {
    queryClient.invalidateQueries({ queryKey: ["team-tasks"] });
    queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
  };

  const cancelMutation = useMutation({
    mutationFn: (taskId: string) => taskService.cancelTask(taskId),
    onSuccess: () => {
      toast.success("Task cancelled");
      invalidateLists();
      setCancellingTask(null);
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setCancellingTask(null);
    },
  });

  const canCancel = (task: Task) => task.status !== "DONE" && task.status !== "CANCELLED";

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Assignee</TableHead>
              {scope === "admin" && <TableHead>Department</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: columnCount }).map((_, c) => (
                    <TableCell key={c}>
                      <Skeleton className="h-5 w-full max-w-28" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading && isError && (
              <TableRow>
                <TableCell colSpan={columnCount} className="h-32 text-center text-sm text-destructive">
                  Couldn&apos;t load tasks.
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !isError && tasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={columnCount} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <ClipboardList className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">No tasks found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              !isError &&
              tasks.map((task) => (
                <TableRow
                  key={task.id}
                  className="cursor-pointer"
                  onClick={() => onViewDetail(task.id)}
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">{task.taskId}</span>
                      <span className="font-medium">{task.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{task.assignedTo?.fullName ?? "Unassigned"}</span>
                      <span className="text-xs text-muted-foreground">
                        {task.assignedTo?.employeeId ?? "—"}
                      </span>
                    </div>
                  </TableCell>
                  {scope === "admin" && <TableCell>{task.department?.name ?? "—"}</TableCell>}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <TaskStatusBadge status={task.status} />
                      <TaskRevisionIndicator count={task.revisionCount} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <TaskPriorityBadge priority={task.priority} />
                  </TableCell>
                  <TableCell>
                    {task.dueDate ? (
                      <span className={task.overdue ? "font-medium text-destructive" : undefined}>
                        {formatISTDate(task.dueDate)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${task.title}`}
                        onClick={() => setEditingTask(task)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Reassign ${task.title}`}
                        onClick={() => setReassigningTask(task)}
                      >
                        <Repeat className="h-4 w-4" />
                      </Button>
                      {canCancel(task) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Cancel ${task.title}`}
                          onClick={() => setCancellingTask(task)}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} tasks
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <TaskFormDialog
        open={editingTask !== null}
        onOpenChange={(open) => !open && setEditingTask(null)}
        task={editingTask ?? undefined}
      />

      <TaskReassignDialog task={reassigningTask} onOpenChange={(open) => !open && setReassigningTask(null)} />

      <ConfirmDialog
        open={cancellingTask !== null}
        onOpenChange={(open) => !open && setCancellingTask(null)}
        title="Cancel task?"
        description={cancellingTask ? `"${cancellingTask.title}" will be marked as cancelled.` : ""}
        confirmLabel="Cancel Task"
        destructive
        isLoading={cancelMutation.isPending}
        onConfirm={() => cancellingTask && cancelMutation.mutate(cancellingTask.id)}
      />
    </div>
  );
}
