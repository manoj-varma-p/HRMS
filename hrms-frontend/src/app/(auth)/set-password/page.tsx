"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { SetPasswordForm } from "@/features/auth/components/set-password-form";
import { useAuth } from "@/hooks/use-auth";
import { ROUTES } from "@/constants/routes";

export default function SetPasswordPage() {
  const { status, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(ROUTES.LOGIN);
    } else if (status === "authenticated" && user && !user.mustChangePassword) {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [status, user, router]);

  if (
    status === "loading" ||
    status === "unauthenticated" ||
    (status === "authenticated" && user && !user.mustChangePassword)
  ) {
    return (
      <div className="flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Set your password</h2>
        <p className="text-sm text-muted-foreground">
          You&apos;re signing in for the first time. Choose a new password to continue.
        </p>
      </div>
      <SetPasswordForm />
    </>
  );
}
