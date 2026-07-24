"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useAdobeLicenseAccess } from "@/hooks/use-adobe-license-access";
import { AdobeLicensesSpreadsheet } from "@/features/administration/components/adobe-licenses-spreadsheet";

export default function AdministrationAdobeLicensesPage() {
  const router = useRouter();
  const { canAccess, isLoading } = useAdobeLicenseAccess();

  if (isLoading) return null;

  if (!canAccess) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-1 text-center">
        <p className="text-sm font-medium">Access restricted</p>
        <p className="text-sm text-muted-foreground">
          You don&apos;t have permission to view this page.
        </p>
      </div>
    );
  }

  return (
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

      <AdobeLicensesSpreadsheet />
    </div>
  );
}
