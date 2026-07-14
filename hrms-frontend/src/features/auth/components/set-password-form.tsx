"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
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

const fieldInputClass =
  "h-10 rounded-xl border-border/70 pl-9 transition-all hover:border-border focus-visible:border-primary";
const fieldLabelClass = "text-xs font-semibold tracking-wider text-muted-foreground uppercase";

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
        <Alert variant="destructive" className="px-3 py-2.5">
          <AlertDescription className="text-xs">{serverError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="newPassword" className={fieldLabelClass}>
          New Password
        </Label>
        <div className="relative flex items-center">
          <Lock className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground/70" />
          <Input
            id="newPassword"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={isSubmitting}
            className={fieldInputClass}
            {...register("newPassword")}
          />
        </div>
        {errors.newPassword && (
          <p className="mt-0.5 text-xs text-destructive">{errors.newPassword.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword" className={fieldLabelClass}>
          Confirm Password
        </Label>
        <div className="relative flex items-center">
          <Lock className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground/70" />
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={isSubmitting}
            className={fieldInputClass}
            {...register("confirmPassword")}
          />
        </div>
        {errors.confirmPassword && (
          <p className="mt-0.5 text-xs text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 h-10 gap-2 rounded-xl font-semibold shadow-sm transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShieldCheck className="h-4 w-4" />
        )}
        Set Password
      </Button>
    </form>
  );
}
