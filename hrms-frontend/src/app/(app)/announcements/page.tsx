"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Megaphone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ROLES } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import * as announcementService from "@/services/announcement.service";
import { ReportSearchInput } from "@/features/reports/components/filters/report-search-input";
import { ReportPagination } from "@/features/reports/components/report-pagination";
import { AnnouncementCard } from "@/features/announcements/components/announcement-card";

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN;

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["announcements", { search: debouncedSearch, page }],
    queryFn: () =>
      announcementService
        .listAnnouncements({ search: debouncedSearch, page, limit: 10 })
        .then((res) => res.data),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Announcements</h1>
          <p className="text-sm text-muted-foreground">Company-wide updates and news.</p>
        </div>
        {isAdmin && (
          <Button nativeButton={false} render={<Link href={ROUTES.ANNOUNCEMENTS_ADMIN} />}>
            <Plus className="h-4 w-4" />
            Manage Announcements
          </Button>
        )}
      </div>

      <ReportSearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search announcements" />

      <div className="flex flex-col gap-3">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}

        {!isLoading && isError && (
          <p className="text-sm text-destructive">Couldn&apos;t load announcements. Please try again.</p>
        )}

        {!isLoading && !isError && (data?.announcements.length ?? 0) === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Megaphone className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">No announcements found</p>
            <p className="text-sm text-muted-foreground">Check back later for company updates.</p>
          </div>
        )}

        {!isLoading &&
          !isError &&
          data?.announcements.map((a) => (
            <Link key={a.id} href={ROUTES.ANNOUNCEMENT_DETAIL(a.id)}>
              <AnnouncementCard announcement={a} />
            </Link>
          ))}
      </div>

      {data?.pagination && (
        <ReportPagination pagination={data.pagination} onPageChange={setPage} itemLabel="announcements" />
      )}
    </div>
  );
}
