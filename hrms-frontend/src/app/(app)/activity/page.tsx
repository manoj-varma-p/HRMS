"use client";

import { useState } from "react";
import { History } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleGuard } from "@/components/layout/role-guard";
import { ROLES } from "@/constants/roles";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useQuery } from "@tanstack/react-query";
import * as activityService from "@/services/activity.service";
import { formatActivityLabel } from "@/features/dashboard/activity-formatter";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { ReportSearchInput } from "@/features/reports/components/filters/report-search-input";
import { DateRangeFilter, DateRangeValue } from "@/features/reports/components/filters/date-range-filter";
import { ReportPagination } from "@/features/reports/components/report-pagination";
import { EmptyReportState } from "@/features/reports/components/empty-report-state";

const COLUMN_COUNT = 4;

export default function ActivityCenterPage() {
  return (
    <RoleGuard allow={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
      <ActivityCenterPageContent />
    </RoleGuard>
  );
}

function ActivityCenterPageContent() {
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<DateRangeValue>({});
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["activity-center", { search: debouncedSearch, ...range, page }],
    queryFn: () =>
      activityService
        .listActivity({ search: debouncedSearch, ...range, page, limit: 25 })
        .then((res) => res.data),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activity Center</h1>
        <p className="text-sm text-muted-foreground">
          A complete audit trail of employee, attendance, leave, report, holiday, and announcement actions.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <ReportSearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search by employee ID"
        />
        <DateRangeFilter
          value={range}
          onChange={(next) => {
            setRange(next);
            setPage(1);
          }}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {Array.from({ length: COLUMN_COUNT }).map((_, c) => (
                    <TableCell key={c}>
                      <Skeleton className="h-5 w-full max-w-40" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading && isError && (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} className="h-32 text-center">
                  <p className="text-sm text-destructive">Couldn&apos;t load activity. Please try again.</p>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !isError && (data?.activities.length ?? 0) === 0 && (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} className="h-40 text-center">
                  <EmptyReportState
                    icon={History}
                    title="No activity found"
                    hint="Try adjusting the search or date range."
                  />
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              !isError &&
              data?.activities.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-muted-foreground">
                    {formatRelativeTime(entry.createdAt)}
                  </TableCell>
                  <TableCell className="font-medium">{entry.actorEmployeeId}</TableCell>
                  <TableCell>{formatActivityLabel(entry)}</TableCell>
                  <TableCell className="text-muted-foreground">{entry.targetType}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {data?.pagination && (
        <ReportPagination pagination={data.pagination} onPageChange={setPage} itemLabel="activity entries" />
      )}
    </div>
  );
}
