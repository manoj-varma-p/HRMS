"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, CalendarPlus } from "lucide-react";
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
import * as leaveService from "@/services/leave.service";
import * as employeeService from "@/services/employee.service";

const schema = z.object({
  employeeId: z.string().min(1, "Select an employee"),
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
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeId: "",
      days: 1,
      reason: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      leaveService.grantExtraLeave({
        ...values,
        year: new Date().getFullYear(),
      }),
    onSuccess: () => {
      toast.success("Comp Off leaves granted successfully!");
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
        Grant Comp Off Leaves
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Grant Comp Off Leaves</DialogTitle>
          <DialogDescription>
            Credit Comp Off leave days to an employee.
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="days">Comp Off Days to Credit</Label>
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
              placeholder="e.g. Weekend overtime work, project deadline support..."
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
              Grant Comp Off Leave
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
