"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, CalendarPlus } from "lucide-react";
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
import * as employeeService from "@/services/employee.service";

const schema = z.object({
  employeeId: z.string().min(1, "Select an employee"),
  leaveType: z.enum([LEAVE_TYPES.SICK, LEAVE_TYPES.CASUAL_PAID, LEAVE_TYPES.ANNUAL]),
  period: z.enum(["H1", "H2", "ANNUAL"]),
  days: z.coerce.number().min(0.5, "At least 0.5 days required"),
  reason: z.string().trim().min(3, "Please enter a reason/remarks"),
});

type FormValues = z.infer<typeof schema>;

export function GrantExtraLeaveDialog() {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: employeesData, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["employees-list-all"],
    queryFn: () => employeeService.listEmployees({ limit: 100 }).then((res) => res.data.employees),
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeId: "",
      leaveType: LEAVE_TYPES.SICK,
      period: "H1",
      days: 1,
      reason: "",
    },
  });

  const selectedLeaveType = watch("leaveType");

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      leaveService.grantExtraLeave({
        ...values,
        year: new Date().getFullYear(),
      }),
    onSuccess: () => {
      toast.success("Extra leaves granted successfully!");
      queryClient.invalidateQueries({ queryKey: ["leave-allocations"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balance"] });
      queryClient.invalidateQueries({ queryKey: ["my-leaves"] });
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
        <CalendarPlus className="h-4 w-4" />
        Grant Extra Leaves
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Grant Extra Leaves</DialogTitle>
          <DialogDescription>
            Credit additional leave days to an employee's annual or half-year leave balance.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values as FormValues))}
          className="flex flex-col gap-4"
        >
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            <Label>Select Employee</Label>
            <Controller
              control={control}
              name="employeeId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-label="Employee">
                    <SelectValue placeholder={isLoadingEmployees ? "Loading employees..." : "Select Employee"}>
                      {(val: string) => {
                        const emp = employeesData?.find((e) => e.id === val);
                        return emp ? `${emp.fullName} (${emp.employeeId})` : "Select Employee";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {employeesData?.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.employeeId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.employeeId && (
              <p className="text-xs text-destructive">{errors.employeeId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Leave Type</Label>
              <Controller
                control={control}
                name="leaveType"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      field.onChange(val);
                      if (val === LEAVE_TYPES.ANNUAL) {
                        setValue("period", "ANNUAL");
                      } else {
                        setValue("period", "H1");
                      }
                    }}
                  >
                    <SelectTrigger aria-label="Leave Type">
                      <SelectValue placeholder="Leave Type">
                        {(v: string) => LEAVE_TYPE_LABELS[v as keyof typeof LEAVE_TYPE_LABELS] || v}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={LEAVE_TYPES.SICK}>Sick Leave</SelectItem>
                      <SelectItem value={LEAVE_TYPES.CASUAL_PAID}>Casual Leave</SelectItem>
                      <SelectItem value={LEAVE_TYPES.ANNUAL}>Annual Leave</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Period / Half</Label>
              <Controller
                control={control}
                name="period"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={selectedLeaveType === LEAVE_TYPES.ANNUAL}
                  >
                    <SelectTrigger aria-label="Period">
                      <SelectValue placeholder="Period">
                        {(v: string) =>
                          v === "H1"
                            ? "H1 (Jan - Jun)"
                            : v === "H2"
                              ? "H2 (Jul - Dec)"
                              : "Full Year"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {selectedLeaveType !== LEAVE_TYPES.ANNUAL ? (
                        <>
                          <SelectItem value="H1">H1 (Jan - Jun)</SelectItem>
                          <SelectItem value="H2">H2 (Jul - Dec)</SelectItem>
                        </>
                      ) : (
                        <SelectItem value="ANNUAL">Full Year</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="days">Extra Days to Credit</Label>
            <Input
              id="days"
              type="number"
              step="0.5"
              min="0.5"
              disabled={isSubmitting}
              {...register("days")}
            />
            {errors.days && (
              <p className="text-xs text-destructive">{errors.days.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="reason">Reason / Remarks</Label>
            <Textarea
              id="reason"
              placeholder="e.g. Approved medical extension, performance bonus credit..."
              disabled={isSubmitting}
              {...register("reason")}
            />
            {errors.reason && (
              <p className="text-xs text-destructive">{errors.reason.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Grant Extra Leave
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
