"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { useAuth } from "@/hooks/use-auth";
import { ROUTES } from "@/constants/routes";

export default function ForgotPasswordPage() {
  const { status, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(user.mustChangePassword ? ROUTES.SET_PASSWORD : ROUTES.DASHBOARD);
    }
  }, [status, user, router]);

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Reset your password</h2>
        <p className="text-sm text-muted-foreground">
          Enter your account email and we&apos;ll send you a link to set a new one.
        </p>
      </div>
      <ForgotPasswordForm />
    </>
  );
}
