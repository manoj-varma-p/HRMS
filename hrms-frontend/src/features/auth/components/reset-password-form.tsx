"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as authService from "@/services/auth.service";
import { ROUTES } from "@/constants/routes";

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

const fieldInputClass =
  "h-10 rounded-xl border-border/70 pl-9 transition-all hover:border-border focus-visible:border-primary";
const fieldLabelClass = "text-xs font-semibold tracking-wider text-muted-foreground uppercase";

export function ResetPasswordForm() {
  const token = useSearchParams().get("token");
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(values: ResetPasswordValues) {
    if (!token) return;
    setServerError(null);
    try {
      await authService.resetPassword(token, values.newPassword);
      setDone(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Could not reset password");
    }
  }

  if (!token) {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="destructive" className="px-3 py-2.5">
          <AlertDescription className="text-xs">
            This reset link is missing or malformed. Request a new one to continue.
          </AlertDescription>
        </Alert>
        <Button
          nativeButton={false}
          render={<Link href={ROUTES.FORGOT_PASSWORD} />}
          className="h-10 w-full rounded-xl"
        >
          Request a new link
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-6 w-6 text-primary" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-medium">Password updated</p>
          <p className="text-sm text-muted-foreground">You can now sign in with your new password.</p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href={ROUTES.LOGIN} />}
          className="mt-2 h-10 w-full rounded-xl"
        >
          Sign in
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {serverError && (
        <Alert variant="destructive" className="px-3 py-2.5">
          <AlertDescription className="text-xs">
            {serverError}{" "}
            <Link href={ROUTES.FORGOT_PASSWORD} className="font-medium underline">
              Request a new link
            </Link>
          </AlertDescription>
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
        Set New Password
      </Button>
    </form>
  );
}
