"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoleGuard } from "@/components/layout/role-guard";
import { ROLES } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import * as leaveService from "@/services/leave.service";
import {
  AdminLeaveFilters,
  AdminLeaveFilterValues,
} from "@/features/leave/components/admin-leave-filters";
import { AdminLeaveTable } from "@/features/leave/components/admin-leave-table";

export default function AdminLeavePage() {
  return (
    <RoleGuard allow={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
      <AdminLeaveContent />
    </RoleGuard>
  );
}

function AdminLeaveContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("requestId") ?? undefined;
  const [filters, setFilters] = useState<AdminLeaveFilterValues>({
    status: "PENDING",
  });
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-leaves", filters, page],
    queryFn: () =>
      leaveService.adminListLeaves({ ...filters, page, limit: 15 }).then((res) => res.data),
  });

  function handleFiltersChange(next: AdminLeaveFilterValues) {
    setFilters(next);
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-2"
          onClick={() => router.push(ROUTES.LEAVE)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Leave
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Leave Requests</h1>
        <p className="text-sm text-muted-foreground">
          Review, approve, and reject leave requests across the company.
        </p>
      </div>

      <AdminLeaveFilters value={filters} onChange={handleFiltersChange} />

      <AdminLeaveTable
        leaves={data?.leaves ?? []}
        isLoading={isLoading}
        isError={isError}
        pagination={data?.pagination}
        onPageChange={setPage}
        highlightId={highlightId}
      />
    </div>
  );
}
