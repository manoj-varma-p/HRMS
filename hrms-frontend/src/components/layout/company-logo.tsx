"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { apiAssetUrl } from "@/lib/api-client";
import * as publicService from "@/services/public.service";

// Shown in the sidebar header and the mobile topbar — fetched once via
// this shared query key so navigating between pages doesn't re-fetch it,
// and falls back to plain "HRMS" text until a logo is uploaded (or if the
// branding request hasn't resolved yet).
export function CompanyLogo({ className }: { className?: string }) {
  const { data } = useQuery({
    queryKey: ["company-branding"],
    queryFn: publicService.getCompanyBranding,
    staleTime: 5 * 60 * 1000,
  });

  if (data?.logoUrl) {
    return (
      <Image
        src={apiAssetUrl(data.logoUrl)}
        alt={data.name}
        width={28}
        height={28}
        unoptimized
        className={cn("h-7 w-auto max-w-[8rem] object-contain", className)}
      />
    );
  }

  return <span className={className}>{data?.name ?? "HRMS"}</span>;
}
