"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoleGuard } from "@/components/layout/role-guard";
import { ROLES } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import { HolidayManager } from "@/features/leave/components/holiday-manager";

export default function AdministrationHolidaysPage() {
  const router = useRouter();

  return (
    <RoleGuard allow={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
      <div className="flex flex-col gap-6">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 w-fit"
          onClick={() => router.push(ROUTES.ADMINISTRATION)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Administration
        </Button>

        <HolidayManager />
      </div>
    </RoleGuard>
  );
}
