"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { ROUTES } from "@/constants/routes";
import * as authService from "@/services/auth.service";

const setPasswordSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SetPasswordValues = z.infer<typeof setPasswordSchema>;

export function SetPasswordForm() {
  const { applySession } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetPasswordValues>({ resolver: zodResolver(setPasswordSchema) });

  async function onSubmit(values: SetPasswordValues) {
    setServerError(null);
    try {
      const res = await authService.setPassword(values.newPassword);
      applySession(res.data);
      router.replace(ROUTES.DASHBOARD);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Could not update password"
      );
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
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          disabled={isSubmitting}
          {...register("newPassword")}
        />
        {errors.newPassword && (
          <p className="text-sm text-destructive">
            {errors.newPassword.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          disabled={isSubmitting}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Set password
      </Button>
    </form>
  );
}
