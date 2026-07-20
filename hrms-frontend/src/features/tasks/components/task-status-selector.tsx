"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, CornerUpLeft, Loader2, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import * as taskService from "@/services/task.service";
import { ROLES } from "@/constants/roles";
import { Task, TaskStatus } from "@/types/task.types";
import {
  TASK_EMPLOYEE_STATUS_TRANSITIONS,
  TASK_PRIVILEGED_STATUS_TRANSITIONS,
} from "../task-status-meta";
import { TaskStatusBadge } from "./task-status-badge";

// Labels/icons keyed by the specific (from, to) pair, not just the target
// status — DONE -> IN_PROGRESS ("Reopen") and IN_REVIEW -> IN_PROGRESS
// ("Request Changes") share a target but mean very different things.
function getActionConfig(from: TaskStatus, to: TaskStatus) {
  if (to === "CANCELLED") {
    return { label: "Cancel Task", icon: X, variant: "destructive" as const };
  }
  if (from === "DONE" && to === "IN_PROGRESS") {
    return { label: "Reopen", icon: RotateCcw, variant: "outline" as const };
  }
  if (from === "IN_REVIEW" && to === "IN_PROGRESS") {
    return { label: "Request Changes", icon: CornerUpLeft, variant: "outline" as const };
  }
  if (to === "IN_REVIEW") return { label: "Submit for Review", icon: ArrowRight, variant: undefined };
  if (to === "DONE") return { label: "Mark Done", icon: ArrowRight, variant: undefined };
  return { label: "Start Progress", icon: ArrowRight, variant: undefined };
}

export function TaskStatusSelector({ task }: { task: Task }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [requestChangesOpen, setRequestChangesOpen] = useState(false);
  const [changesComment, setChangesComment] = useState("");

  // The assignee gets the forward-path-plus-cancel subset; the assigner,
  // department head (of THIS task's department), or admin get the full
  // graph — mirrors task.service.ts's assertCanChangeStatus exactly, so
  // this never offers a move the API would reject. TaskDetailSheet is now
  // opened from Team/Admin tables too (Phase 3), not just My Tasks, so a
  // privileged reviewer must see their fuller action set here.
  const isAdmin = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN;
  const isDeptHeadOfTask =
    !!task.department && (user?.departmentHeadOf ?? []).some((d) => d.id === task.department!._id);
  const isPrivilegedViewer = isAdmin || isDeptHeadOfTask;

  const nextOptions = (
    isPrivilegedViewer ? TASK_PRIVILEGED_STATUS_TRANSITIONS : TASK_EMPLOYEE_STATUS_TRANSITIONS
  )[task.status];
  // Cancel always renders last, everything else keeps the transition
  // table's original order — a plain `.sort((a) => ...)` comparator only
  // takes one argument and doesn't reliably produce this, so partition
  // explicitly instead.
  const orderedOptions = [
    ...nextOptions.filter((s) => s !== "CANCELLED"),
    ...nextOptions.filter((s) => s === "CANCELLED"),
  ];

  const invalidateAfterChange = () => {
    queryClient.invalidateQueries({ queryKey: ["task", task.id] });
    queryClient.invalidateQueries({ queryKey: ["task-comments", task.id] });
    queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
    queryClient.invalidateQueries({ queryKey: ["team-tasks"] });
    queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
  };

  const mutation = useMutation({
    mutationFn: (status: TaskStatus) => taskService.changeTaskStatus(task.id, status),
    onSuccess: () => {
      toast.success("Task status updated");
      invalidateAfterChange();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Request Changes gets its own mutation (rather than reusing the one
  // above) so its dialog can close and clear the comment field on success
  // without that logic leaking into every other status button.
  const requestChangesMutation = useMutation({
    mutationFn: () => taskService.changeTaskStatus(task.id, "IN_PROGRESS", changesComment),
    onSuccess: () => {
      toast.success("Changes requested");
      invalidateAfterChange();
      setRequestChangesOpen(false);
      setChangesComment("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (orderedOptions.length === 0) {
    return <TaskStatusBadge status={task.status} />;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <TaskStatusBadge status={task.status} />
      {orderedOptions.map((to) => {
        const { label, icon: Icon, variant } = getActionConfig(task.status, to);
        const isRequestChanges = task.status === "IN_REVIEW" && to === "IN_PROGRESS";
        return (
          <Button
            key={to}
            size="sm"
            variant={variant}
            disabled={mutation.isPending}
            onClick={() =>
              isRequestChanges ? setRequestChangesOpen(true) : mutation.mutate(to)
            }
          >
            {mutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Icon className="h-3.5 w-3.5" />
            )}
            {label}
          </Button>
        );
      })}

      <Dialog
        open={requestChangesOpen}
        onOpenChange={(open) => {
          setRequestChangesOpen(open);
          if (!open) setChangesComment("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Sends the task back to In Progress for the same assignee. Let them know what needs
              to change — this is posted as a comment on the task.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="request-changes-comment">What needs to change?</Label>
            <Textarea
              id="request-changes-comment"
              placeholder="e.g. The Q3 numbers on page 2 don't match the report"
              value={changesComment}
              onChange={(e) => setChangesComment(e.target.value)}
              disabled={requestChangesMutation.isPending}
              maxLength={2000}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => requestChangesMutation.mutate()}
              disabled={requestChangesMutation.isPending}
            >
              {requestChangesMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Send Back for Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
