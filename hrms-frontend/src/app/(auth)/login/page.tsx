"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
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
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Sign in to HRMS</CardTitle>
        <CardDescription>
          Use the credentials provided by your administrator.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
