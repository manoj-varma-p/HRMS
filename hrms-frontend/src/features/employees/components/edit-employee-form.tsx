"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
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
import { EMPLOYEE_STATUS } from "@/constants/employee-status";
import { ROLES } from "@/constants/roles";
import * as employeeService from "@/services/employee.service";
import * as configurationService from "@/services/configuration.service";
import { CONFIGURATION_QUERY_KEY } from "@/features/administration/components/administration-page-shell";
import { Employee } from "@/types/employee.types";

const phoneRegex = /^\+?[0-9][0-9\s-]{6,18}$/;

const schema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  phone: z.string().trim().regex(phoneRegex, "Enter a valid phone number"),
  dateOfBirth: z.string().optional().or(z.literal("")),
  department: z.string().min(1, "Select a department"),
  designation: z.string().min(1, "Select a designation"),
  gracePeriodOverrideMinutes: z.string().optional().or(z.literal("")),
  role: z.string().min(1, "Select a role"),
  status: z.string().min(1, "Select a status"),
});

type FormValues = z.infer<typeof schema>;

const STATUS_OPTIONS = Object.values(EMPLOYEE_STATUS);
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  NOTICE_PERIOD: "Notice Period",
  RESIGNED: "Resigned",
  TERMINATED: "Terminated",
};

const ROLE_LABELS: Record<string, string> = {
  EMPLOYEE: "Employee",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
};

interface EditEmployeeFormProps {
  employee: Employee;
  onSaved: (employee: Employee) => void;
}

export function EditEmployeeForm({ employee, onSaved }: EditEmployeeFormProps) {
  const { user } = useAuth();
  const { data: departments } = useDepartments(true);
  const { data: designations } = useDesignations(true);
  const { data: config } = useQuery({
    queryKey: CONFIGURATION_QUERY_KEY,
    queryFn: () => configurationService.getConfiguration().then((res) => res.data.configuration),
  });
  const [serverError, setServerError] = useState<string | null>(null);

  // Mirrors the backend rule: only a Super Admin can grant/revoke Admin
  // access, and a Super Admin's own role isn't editable through this form.
  const canEditRole = user?.role === ROLES.SUPER_ADMIN && employee.role !== ROLES.SUPER_ADMIN;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: employee.fullName,
      phone: employee.phone,
      dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.slice(0, 10) : "",
      department: employee.department?._id ?? "",
      designation: employee.designation?._id ?? "",
      gracePeriodOverrideMinutes:
        employee.gracePeriodOverrideMinutes != null
          ? String(employee.gracePeriodOverrideMinutes)
          : "",
      role: employee.role,
      status: employee.status,
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const res = await employeeService.updateEmployee(employee.id, {
        ...values,
        // An empty string fails the backend's date validator outright
        // (it doesn't coerce "" to "no value") — omit the field entirely
        // when there's nothing to send, same as every other optional field.
        dateOfBirth: values.dateOfBirth || undefined,
        // Here blank is meaningful (clear the override, fall back to the
        // company default) so it's sent as null, not omitted.
        gracePeriodOverrideMinutes:
          values.gracePeriodOverrideMinutes === ""
            ? null
            : Number(values.gracePeriodOverrideMinutes),
      });
      onSaved(res.data.employee);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Could not update employee");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input id="fullName" disabled={isSubmitting} {...register("fullName")} />
        {errors.fullName && (
          <p className="text-sm text-destructive">{errors.fullName.message}</p>
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
        <Label htmlFor="dateOfBirth">Date of Birth</Label>
        <Input
          id="dateOfBirth"
          type="date"
          disabled={isSubmitting}
          {...register("dateOfBirth")}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="gracePeriodOverrideMinutes">Grace Period Override</Label>
        <Input
          id="gracePeriodOverrideMinutes"
          type="number"
          min={0}
          max={480}
          placeholder="Company default"
          disabled={isSubmitting}
          {...register("gracePeriodOverrideMinutes")}
        />
        <p className="text-sm text-muted-foreground">
          Minutes late still counted as on-time, for this employee only. Leave blank to use the
          company default{config ? ` (${config.officeSettings.gracePeriodMinutes} minutes)` : ""}.
        </p>
        {errors.gracePeriodOverrideMinutes && (
          <p className="text-sm text-destructive">{errors.gracePeriodOverrideMinutes.message}</p>
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
                    {!d.isActive ? " (inactive)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
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
                    {!d.isActive ? " (inactive)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Role</Label>
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={!canEditRole}>
              <SelectTrigger aria-label="Role">
                <SelectValue placeholder="Select role">
                  {(v: string) => ROLE_LABELS[v]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ROLES.EMPLOYEE}>Employee</SelectItem>
                <SelectItem value={ROLES.ADMIN}>Admin</SelectItem>
                {employee.role === ROLES.SUPER_ADMIN && (
                  <SelectItem value={ROLES.SUPER_ADMIN}>Super Admin</SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
        />
        {!canEditRole && (
          <p className="text-sm text-muted-foreground">
            {employee.role === ROLES.SUPER_ADMIN
              ? "A Super Admin's role can't be changed here."
              : "Only a Super Admin can change an employee's role."}
          </p>
        )}
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
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="mt-2 self-start">
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Save changes
      </Button>
    </form>
  );
}
