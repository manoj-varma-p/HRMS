"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEAVE_TYPES } from "@/constants/leave-types";
import { LEAVE_TYPE_LABELS } from "../leave-status-meta";
import * as leaveService from "@/services/leave.service";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const schema = z
  .object({
    leaveType: z.string().min(1, "Select a leave type"),
    startDate: z.string().regex(dateRegex, "Select a start date"),
    endDate: z.string().regex(dateRegex, "Select an end date"),
    reason: z.string().trim().min(5, "Please provide a reason (at least 5 characters)"),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: "Start date must be before or equal to the end date",
    path: ["endDate"],
  });

type FormValues = z.infer<typeof schema>;

export function ApplyLeaveDialog() {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { leaveType: LEAVE_TYPES.CASUAL_PAID },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => leaveService.applyLeave(values),
    onSuccess: () => {
      toast.success("Leave request submitted");
      queryClient.invalidateQueries({ queryKey: ["my-leaves"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balance"] });
      reset();
      setOpen(false);
    },
    onError: (err: Error) => setServerError(err.message),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setServerError(null);
          reset();
        }
      }}
    >
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" />
        Apply Leave
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply for Leave</DialogTitle>
          <DialogDescription>
            Select a leave type and date range. An admin will review your request.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="flex flex-col gap-4"
        >
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            <Label>Leave Type</Label>
            <Controller
              control={control}
              name="leaveType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-label="Leave Type">
                    <SelectValue placeholder="Select leave type">
                      {(v: string) => LEAVE_TYPE_LABELS[v]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(LEAVE_TYPES).map((t) => (
                      <SelectItem key={t} value={t}>
                        {LEAVE_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                disabled={isSubmitting}
                {...register("startDate")}
              />
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                disabled={isSubmitting}
                {...register("endDate")}
              />
              {errors.endDate && (
                <p className="text-sm text-destructive">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea id="reason" disabled={isSubmitting} {...register("reason")} />
            {errors.reason && (
              <p className="text-sm text-destructive">{errors.reason.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
