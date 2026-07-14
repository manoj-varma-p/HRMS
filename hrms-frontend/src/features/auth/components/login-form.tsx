"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, LogIn, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { ROUTES } from "@/constants/routes";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

const fieldInputClass =
  "h-10 rounded-xl border-border/70 pl-9 transition-all hover:border-border focus-visible:border-primary";
const fieldLabelClass = "text-xs font-semibold tracking-wider text-muted-foreground uppercase";

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginValues) {
    setServerError(null);
    try {
      const user = await login(values.email, values.password);
      router.replace(user.mustChangePassword ? ROUTES.SET_PASSWORD : ROUTES.DASHBOARD);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Login failed");
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

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className={fieldLabelClass}>
            Password
          </Label>
          <Link
            href={ROUTES.FORGOT_PASSWORD}
            className="text-xs font-medium text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative flex items-center">
          <Lock className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground/70" />
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={isSubmitting}
            className={fieldInputClass}
            {...register("password")}
          />
        </div>
        {errors.password && (
          <p className="mt-0.5 text-xs text-destructive">{errors.password.message}</p>
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
          <LogIn className="h-4 w-4" />
        )}
        Sign in
      </Button>
    </form>
  );
}
