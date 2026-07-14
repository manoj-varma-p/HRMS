"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as taskService from "@/services/task.service";
import { Task, TaskStatus } from "@/types/task.types";
import { TASK_EMPLOYEE_STATUS_TRANSITIONS } from "../task-status-meta";
import { TaskStatusBadge } from "./task-status-badge";

// Verb-first labels for the assignee's own forward path — the backend's
// transition table (mirrored in TASK_EMPLOYEE_STATUS_TRANSITIONS) is the
// actual source of truth; this map only supplies the button copy for
// whichever edges that table currently allows.
const FORWARD_ACTION_LABEL: Partial<Record<TaskStatus, string>> = {
  IN_PROGRESS: "Start Progress",
  IN_REVIEW: "Submit for Review",
  DONE: "Mark Done",
};

export function TaskStatusSelector({ task }: { task: Task }) {
  const queryClient = useQueryClient();
  const nextOptions = TASK_EMPLOYEE_STATUS_TRANSITIONS[task.status];
  const forwardTarget = nextOptions.find((s) => s !== "CANCELLED");
  const canCancel = nextOptions.includes("CANCELLED");

  const mutation = useMutation({
    mutationFn: (status: TaskStatus) => taskService.changeTaskStatus(task.id, status),
    onSuccess: () => {
      toast.success("Task status updated");
      queryClient.invalidateQueries({ queryKey: ["task", task.id] });
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (nextOptions.length === 0) {
    return <TaskStatusBadge status={task.status} />;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <TaskStatusBadge status={task.status} />
      {forwardTarget && (
        <Button
          size="sm"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate(forwardTarget)}
        >
          {mutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ArrowRight className="h-3.5 w-3.5" />
          )}
          {FORWARD_ACTION_LABEL[forwardTarget]}
        </Button>
      )}
      {canCancel && (
        <Button
          size="sm"
          variant="destructive"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate("CANCELLED")}
        >
          <X className="h-3.5 w-3.5" />
          Cancel Task
        </Button>
      )}
    </div>
  );
}
