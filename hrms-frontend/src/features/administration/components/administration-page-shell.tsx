"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleGuard } from "@/components/layout/role-guard";
import { ROLES } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import * as configurationService from "@/services/configuration.service";
import { Configuration } from "@/types/configuration.types";

export const CONFIGURATION_QUERY_KEY = ["configuration"];

// Shared by all 7 Administration settings pages: role gate, back button,
// one cached fetch of the whole Configuration document (TanStack Query
// dedupes this across pages automatically — navigating between settings
// sections doesn't re-fetch), and a loading skeleton. Each page supplies
// only its title/description and a render function for the loaded config.
export function AdministrationPageShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: (config: Configuration) => React.ReactNode;
}) {
  const router = useRouter();

  const { data, isLoading, isError } = useQuery({
    queryKey: CONFIGURATION_QUERY_KEY,
    queryFn: () => configurationService.getConfiguration().then((res) => res.data.configuration),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <RoleGuard allow={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
      <div className="flex flex-col gap-6 pb-6">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 w-fit"
          onClick={() => router.push(ROUTES.ADMINISTRATION)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Administration
        </Button>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {isLoading && (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}

        {!isLoading && isError && (
          <p className="text-sm text-destructive">Couldn&apos;t load configuration. Please try again.</p>
        )}

        {!isLoading && !isError && data && children(data)}
      </div>
    </RoleGuard>
  );
}
