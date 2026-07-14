"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { LoginForm } from "@/features/auth/components/login-form";
import { useAuth } from "@/hooks/use-auth";
import { ROUTES } from "@/constants/routes";

export default function LoginPage() {
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
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Sign in to HRMS</h2>
        <p className="text-sm text-muted-foreground">
          Use the credentials provided by your administrator.
        </p>
      </div>
      <LoginForm />
    </>
  );
}
