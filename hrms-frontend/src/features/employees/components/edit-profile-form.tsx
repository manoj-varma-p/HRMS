"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as employeeService from "@/services/employee.service";
import { Employee } from "@/types/employee.types";

const phoneRegex = /^\+?[0-9][0-9\s-]{6,18}$/;

const schema = z.object({
  phone: z.string().trim().regex(phoneRegex, "Enter a valid phone number"),
  dateOfBirth: z.string().optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  emergencyContactName: z.string().trim().optional().or(z.literal("")),
  emergencyContactPhone: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || phoneRegex.test(v), "Enter a valid phone number"),
});

type FormValues = z.infer<typeof schema>;

interface EditProfileFormProps {
  employee: Employee;
  onSaved: (employee: Employee) => void;
}

export function EditProfileForm({ employee, onSaved }: EditProfileFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      phone: employee.phone,
      dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.slice(0, 10) : "",
      address: employee.address ?? "",
      emergencyContactName: employee.emergencyContact?.name ?? "",
      emergencyContactPhone: employee.emergencyContact?.phone ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const res = await employeeService.updateMyProfile({
        phone: values.phone,
        dateOfBirth: values.dateOfBirth || undefined,
        address: values.address || undefined,
        emergencyContact:
          values.emergencyContactName && values.emergencyContactPhone
            ? {
                name: values.emergencyContactName,
                phone: values.emergencyContactPhone,
              }
            : undefined,
      });
      onSaved(res.data.employee);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Could not update profile");
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
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" disabled={isSubmitting} {...register("address")} />
        {errors.address && (
          <p className="text-sm text-destructive">{errors.address.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
        <Input
          id="emergencyContactName"
          disabled={isSubmitting}
          {...register("emergencyContactName")}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
        <Input
          id="emergencyContactPhone"
          disabled={isSubmitting}
          {...register("emergencyContactPhone")}
        />
        {errors.emergencyContactPhone && (
          <p className="text-sm text-destructive">
            {errors.emergencyContactPhone.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="mt-2 self-start">
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Save changes
      </Button>
    </form>
  );
}
