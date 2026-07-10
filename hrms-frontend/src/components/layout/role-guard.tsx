"use client";

import { useAuth } from "@/hooks/use-auth";
import { Role } from "@/constants/roles";

export function RoleGuard({
  allow,
  children,
}: {
  allow: Role[];
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  if (!user || !allow.includes(user.role)) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-1 text-center">
        <p className="text-sm font-medium">Access restricted</p>
        <p className="text-sm text-muted-foreground">
          You don&apos;t have permission to view this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
