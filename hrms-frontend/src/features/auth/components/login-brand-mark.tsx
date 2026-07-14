"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { apiAssetUrl } from "@/lib/api-client";
import * as publicService from "@/services/public.service";

// Same query key as the in-app CompanyLogo (components/layout/company-logo.tsx)
// — this page is pre-auth, but the branding endpoint is public either way, so
// the two share one cached fetch instead of issuing it twice.
function useCompanyBranding() {
  return useQuery({
    queryKey: ["company-branding"],
    queryFn: publicService.getCompanyBranding,
    staleTime: 5 * 60 * 1000,
  });
}

// The hero panel's top-left brand mark. Shows the real uploaded company
// logo once one exists; falls back to a generic icon + name placeholder
// (using the configured company name once it's loaded) until then.
export function LoginBrandMark() {
  const { data } = useCompanyBranding();

  if (data?.logoUrl) {
    return (
      // A fixed dark plate, not a `dark:` variant — logos are frequently
      // designed assuming a dark backdrop (light wordmark, pale accents)
      // and would wash out against this panel's light-mode background
      // otherwise. Keeping it constant means the logo looks the same
      // regardless of which theme the viewer is in.
      <div className="inline-flex items-center rounded-lg bg-zinc-900 px-3 py-2">
        <Image
          src={apiAssetUrl(data.logoUrl)}
          alt={data.name}
          width={160}
          height={40}
          unoptimized
          className="h-9 w-auto max-w-52 object-contain"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-primary bg-background text-primary shadow-sm">
        <Users className="h-5 w-5" strokeWidth={2.5} />
      </div>
      <span className="bg-linear-to-r from-foreground to-foreground/80 bg-clip-text text-xl font-bold tracking-tight text-transparent">
        {data?.name ?? "HRMS Portal"}
      </span>
    </div>
  );
}

// The compact version shown in the mobile-only top bar (right panel).
export function LoginBrandMarkCompact() {
  const { data } = useCompanyBranding();

  if (data?.logoUrl) {
    return (
      <div className="inline-flex items-center rounded-lg bg-zinc-900 px-2.5 py-1.5">
        <Image
          src={apiAssetUrl(data.logoUrl)}
          alt={data.name}
          width={120}
          height={32}
          unoptimized
          className="h-7 w-auto max-w-36 object-contain"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Users className="h-4 w-4" strokeWidth={2.5} />
      </div>
      <span className="text-lg font-bold text-foreground">{data?.name ?? "HRMS"}</span>
    </div>
  );
}
