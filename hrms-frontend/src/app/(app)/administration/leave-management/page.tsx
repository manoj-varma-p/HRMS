"use client";

import { useQuery } from "@tanstack/react-query";
import { AdministrationPageShell } from "@/features/administration/components/administration-page-shell";
import { GrantExtraLeaveDialog } from "@/features/leave/components/grant-extra-leave-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as leaveService from "@/services/leave.service";
import { LEAVE_TYPE_LABELS } from "@/features/leave/leave-status-meta";

export default function AdministrationLeaveManagementPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["leave-allocations"],
    queryFn: () => leaveService.listLeaveAllocations().then((res) => res.data.allocations),
  });

  return (
    <AdministrationPageShell
      title="Comp Off Leaves"
      description="Grant Comp Off leaves to employees and track allocation history logs."
    >
      {() => (
        <div className="flex flex-col gap-6">
          <div className="flex justify-end">
            <GrantExtraLeaveDialog />
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Comp Off Allocations Log</h2>
                <p className="text-xs text-muted-foreground">
                  History of all Comp Off leave credits granted by system administrators.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Days Granted</TableHead>
                    <TableHead>Reason / Remarks</TableHead>
                    <TableHead>Granted By</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-8 w-36" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      </TableRow>
                    ))
                  ) : !data || data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        No Comp Off leaves granted yet. Click "Grant Comp Off Leaves" above to credit days.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((item) => {
                      const initials = item.employee.fullName
                        ? item.employee.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase()
                        : "EM";

                      const dateStr = new Date(item.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      });

                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 overflow-hidden rounded-full border border-border">
                                <AvatarImage
                                  src={item.employee.profilePhoto ?? undefined}
                                  alt={item.employee.fullName}
                                  className="object-cover object-center w-full h-full"
                                />
                                <AvatarFallback className="text-xs font-semibold">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-medium text-sm">{item.employee.fullName}</span>
                                <span className="text-xs text-muted-foreground">
                                  {item.employee.employeeId}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline" className="font-medium">
                              {LEAVE_TYPE_LABELS[item.leaveType as keyof typeof LEAVE_TYPE_LABELS] || item.leaveType}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-sm font-medium">
                            {item.year}
                          </TableCell>

                          <TableCell>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              +{item.days} day(s)
                            </span>
                          </TableCell>

                          <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                            {item.reason}
                          </TableCell>

                          <TableCell className="text-xs font-medium">
                            {item.grantedBy}
                          </TableCell>

                          <TableCell className="text-xs text-muted-foreground">
                            {dateStr}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </AdministrationPageShell>
  );
}
