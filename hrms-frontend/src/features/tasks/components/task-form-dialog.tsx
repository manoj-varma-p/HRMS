"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as taskService from "@/services/task.service";
import { Task, TaskPriority } from "@/types/task.types";
import { TASK_PRIORITY_LABELS } from "../task-status-meta";
import { AssigneePicker } from "./assignee-picker";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(5000).optional(),
  assignedTo: z.string().min(1, "Select an assignee"),
  priority: z.string().min(1),
  dueDate: z.union([z.literal(""), z.string().regex(dateRegex, "Invalid date")]).optional(),
});

type FormValues = z.infer<typeof schema>;

const EMPTY_VALUES: FormValues = {
  title: "",
  description: "",
  assignedTo: "",
  priority: "MEDIUM",
  dueDate: "",
};

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode (title/description/priority/dueDate only, assignee fixed). Absent = create mode. */
  task?: Task;
}

// Fully externally controlled (no built-in DialogTrigger) rather than
// ApplyLeaveDialog's self-contained-trigger shape — this dialog serves two
// entry points (a page-level "Create Task" button and a table row's "Edit"
// action), so it follows documents-panel.tsx's controlled-Dialog pattern
// instead, which is equally established in this codebase.
export function TaskFormDialog({ open, onOpenChange, task }: TaskFormDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(task);

  // `values` (rather than a useEffect + reset()) keeps the form in sync
  // with `task` — react-hook-form resets automatically whenever this
  // object's reference changes, so switching between create/edit or
  // between two different tasks needs no manual synchronization effect.
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: task
      ? {
          title: task.title,
          description: task.description ?? "",
          assignedTo: task.assignedTo?._id ?? "",
          priority: task.priority,
          dueDate: task.dueDate ?? "",
        }
      : EMPTY_VALUES,
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      isEdit
        ? taskService.updateTask(task!.id, {
            title: values.title,
            description: values.description || null,
            priority: values.priority as TaskPriority,
            dueDate: values.dueDate || null,
          })
        : taskService.createTask({
            title: values.title,
            description: values.description || undefined,
            assignedTo: values.assignedTo,
            priority: values.priority as TaskPriority,
            dueDate: values.dueDate || undefined,
          }),
    onSuccess: () => {
      toast.success(isEdit ? "Task updated" : "Task created");
      queryClient.invalidateQueries({ queryKey: ["team-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Task" : "Create Task"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the task's details. Reassigning is a separate action."
              : "Assign a new task. The assignee will be notified in-app."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" disabled={isSubmitting} {...register("title")} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" disabled={isSubmitting} {...register("description")} />
          </div>

          {isEdit ? (
            <div className="flex flex-col gap-2">
              <Label>Assignee</Label>
              <p className="text-sm text-muted-foreground">
                {task!.assignedTo
                  ? `${task!.assignedTo.fullName} (${task!.assignedTo.employeeId})`
                  : "Unassigned"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label>Assignee</Label>
              <Controller
                control={control}
                name="assignedTo"
                render={({ field }) => (
                  <AssigneePicker
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                  />
                )}
              />
              {errors.assignedTo && (
                <p className="text-sm text-destructive">{errors.assignedTo.message}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Priority</Label>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label="Priority">
                      <SelectValue placeholder="Priority">
                        {(v: string) => TASK_PRIORITY_LABELS[v as TaskPriority]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" type="date" disabled={isSubmitting} {...register("dueDate")} />
              {errors.dueDate && (
                <p className="text-sm text-destructive">{errors.dueDate.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
