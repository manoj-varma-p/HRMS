"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import * as taskService from "@/services/task.service";
import { Task } from "@/types/task.types";
import { AssigneePicker } from "./assignee-picker";

interface TaskReassignDialogProps {
  task: Task | null;
  onOpenChange: (open: boolean) => void;
}

// No comment field, unlike the leave approve/reject dialog's "action +
// optional comment" shape — reassignTaskSchema on the backend takes only
// assignedTo, so there's nothing else to submit here.
export function TaskReassignDialog({ task, onOpenChange }: TaskReassignDialogProps) {
  const queryClient = useQueryClient();
  const [assignedTo, setAssignedTo] = useState<string | undefined>(undefined);

  const mutation = useMutation({
    mutationFn: (newAssigneeId: string) => taskService.reassignTask(task!.id, newAssigneeId),
    onSuccess: () => {
      toast.success("Task reassigned");
      queryClient.invalidateQueries({ queryKey: ["team-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
      setAssignedTo(undefined);
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog
      open={task !== null}
      onOpenChange={(next) => {
        if (!next) setAssignedTo(undefined);
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reassign Task</DialogTitle>
          <DialogDescription>
            {task && `Move "${task.title}" to a different assignee.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label>New Assignee</Label>
          <AssigneePicker value={assignedTo} onChange={setAssignedTo} disabled={mutation.isPending} />
        </div>

        <DialogFooter>
          <Button
            disabled={!assignedTo || mutation.isPending}
            onClick={() => assignedTo && mutation.mutate(assignedTo)}
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Reassign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
