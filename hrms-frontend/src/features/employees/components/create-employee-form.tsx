"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDepartments, useDesignations } from "@/hooks/use-reference-data";
import { useAuth } from "@/hooks/use-auth";
import { ROLES } from "@/constants/roles";
import { EMPLOYEE_STATUS } from "@/constants/employee-status";
import * as employeeService from "@/services/employee.service";

const phoneRegex = /^\+?[0-9][0-9\s-]{6,18}$/;

const ROLE_LABELS: Record<string, string> = {
  EMPLOYEE: "Employee",
  ADMIN: "Admin",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  NOTICE_PERIOD: "Notice Period",
};

const schema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().regex(phoneRegex, "Enter a valid phone number"),
  department: z.string().min(1, "Select a department"),
  designation: z.string().min(1, "Select a designation"),
  joiningDate: z.string().min(1, "Select a joining date"),
  role: z.string().min(1, "Select a role"),
  status: z.string().min(1, "Select a status"),
});

type FormValues = z.infer<typeof schema>;

interface CreateEmployeeFormProps {
  onCreated: (result: { employeeName: string; employeeId: string; tempPassword: string }) => void;
}

export function CreateEmployeeForm({ onCreated }: CreateEmployeeFormProps) {
  const { user } = useAuth();
  const { data: departments } = useDepartments();
  const { data: designations } = useDesignations();
  const [serverError, setServerError] = useState<string | null>(null);

  const canAssignAdmin = user?.role === ROLES.SUPER_ADMIN;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: ROLES.EMPLOYEE, status: EMPLOYEE_STATUS.ACTIVE },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const res = await employeeService.createEmployee(values);
      onCreated({
        employeeName: res.data.employee.fullName,
        employeeId: res.data.employee.employeeId,
        tempPassword: res.data.tempPassword,
      });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Could not create employee");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" disabled={isSubmitting} {...register("fullName")} />
          {errors.fullName && (
            <p className="text-sm text-destructive">{errors.fullName.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" disabled={isSubmitting} {...register("email")} />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" disabled={isSubmitting} {...register("phone")} />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label>Department</Label>
          <Controller
            control={control}
            name="department"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger aria-label="Department">
                  <SelectValue placeholder="Select department">
                    {(v: string) => departments?.find((d) => d._id === v)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {departments?.map((d) => (
                    <SelectItem key={d._id} value={d._id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.department && (
            <p className="text-sm text-destructive">{errors.department.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label>Designation</Label>
          <Controller
            control={control}
            name="designation"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger aria-label="Designation">
                  <SelectValue placeholder="Select designation">
                    {(v: string) => designations?.find((d) => d._id === v)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {designations?.map((d) => (
                    <SelectItem key={d._id} value={d._id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.designation && (
            <p className="text-sm text-destructive">{errors.designation.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="joiningDate">Joining Date</Label>
          <Input
            id="joiningDate"
            type="date"
            disabled={isSubmitting}
            {...register("joiningDate")}
          />
          {errors.joiningDate && (
            <p className="text-sm text-destructive">{errors.joiningDate.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label>Role</Label>
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger aria-label="Role">
                  <SelectValue placeholder="Select role">
                    {(v: string) => ROLE_LABELS[v]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ROLES.EMPLOYEE}>Employee</SelectItem>
                  {canAssignAdmin && (
                    <SelectItem value={ROLES.ADMIN}>Admin</SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Status</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger aria-label="Status">
                  <SelectValue placeholder="Select status">
                    {(v: string) => STATUS_LABELS[v]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPLOYEE_STATUS.ACTIVE}>Active</SelectItem>
                  <SelectItem value={EMPLOYEE_STATUS.NOTICE_PERIOD}>
                    Notice Period
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="mt-2 self-start">
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Create Employee
      </Button>
    </form>
  );
}
