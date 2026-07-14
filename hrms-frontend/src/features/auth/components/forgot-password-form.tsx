"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail, MailCheck, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as authService from "@/services/auth.service";
import { ROUTES } from "@/constants/routes";

const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

const fieldInputClass =
  "h-10 rounded-xl border-border/70 pl-9 transition-all hover:border-border focus-visible:border-primary";
const fieldLabelClass = "text-xs font-semibold tracking-wider text-muted-foreground uppercase";

export function ForgotPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordValues) {
    setServerError(null);
    try {
      await authService.forgotPassword(values.email);
      // The backend replies identically whether or not the email is
      // registered, so this success state shows unconditionally too.
      setSubmitted(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <MailCheck className="h-6 w-6 text-primary" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-medium">Check your email</p>
          <p className="text-sm text-muted-foreground">
            We&apos;ve sent a password reset link if that account exists. It expires in 30
            minutes.
          </p>
        </div>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={ROUTES.LOGIN} />}
          className="mt-2 h-10 w-full rounded-xl"
        >
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {serverError && (
        <Alert variant="destructive" className="px-3 py-2.5">
          <AlertDescription className="text-xs">{serverError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email" className={fieldLabelClass}>
          Email Address
        </Label>
        <div className="relative flex items-center">
          <Mail className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground/70" />
          <Input
            id="email"
            type="email"
            placeholder="name@company.com"
            autoComplete="email"
            disabled={isSubmitting}
            className={fieldInputClass}
            {...register("email")}
          />
        </div>
        {errors.email && <p className="mt-0.5 text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 h-10 gap-2 rounded-xl font-semibold shadow-sm transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Send Reset Link
      </Button>

      <Link
        href={ROUTES.LOGIN}
        className="text-center text-xs font-medium text-primary hover:underline"
      >
        Back to sign in
      </Link>
    </form>
  );
}
