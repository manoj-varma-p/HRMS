"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import * as adobeLicenseService from "@/services/adobe-license.service";
import { AdobeLicenseAccessPermission } from "@/types/adobe-license.types";

const ACCESS_QUERY_KEY = ["adobe-license-access-list"];
const UNSET = "";

const PERMISSION_OPTIONS: { value: AdobeLicenseAccessPermission; label: string }[] = [
  { value: "view", label: "View" },
  { value: "edit", label: "Edit" },
];

export function AdobeLicenseAccessDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState(UNSET);
  const [selectedPermission, setSelectedPermission] =
    useState<AdobeLicenseAccessPermission>("view");

  const { data: grantedUsers, isLoading } = useQuery({
    queryKey: ACCESS_QUERY_KEY,
    queryFn: () => adobeLicenseService.listAccess(),
    enabled: open,
  });

  const { data: employees } = useEmployeeOptions();

  const grantableEmployees = (employees ?? []).filter(
    (e) => !grantedUsers?.some((u) => u.id === e.id)
  );

  const invalidateAccess = () => {
    queryClient.invalidateQueries({ queryKey: ACCESS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ["adobe-license-access-me"] });
  };

  const grantMutation = useMutation({
    mutationFn: ({
      userId,
      permission,
    }: {
      userId: string;
      permission: AdobeLicenseAccessPermission;
    }) => adobeLicenseService.grantAccess(userId, permission),
    onSuccess: (_, variables) => {
      toast.success(
        grantedUsers?.some((u) => u.id === variables.userId)
          ? "Access updated"
          : "Access granted"
      );
      setSelectedEmployee(UNSET);
      invalidateAccess();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const revokeMutation = useMutation({
    mutationFn: (userId: string) => adobeLicenseService.revokeAccess(userId),
    onSuccess: () => {
      toast.success("Access revoked");
      invalidateAccess();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage access</DialogTitle>
          <DialogDescription>
            Admins always have full access. Grant an employee View (read-only) or Edit
            (view + change data) access to this sheet.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={selectedEmployee} onValueChange={(v) => v && setSelectedEmployee(v)}>
            <SelectTrigger className="w-full flex-1" aria-label="Select employee">
              <SelectValue placeholder="Select an employee">
                {(v: string) => {
                  if (v === UNSET) return undefined;
                  const employee = grantableEmployees.find((e) => e.id === v);
                  return employee ? `${employee.fullName} (${employee.employeeId})` : undefined;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {grantableEmployees.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.fullName} ({e.employeeId})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedPermission}
            onValueChange={(v) => v && setSelectedPermission(v as AdobeLicenseAccessPermission)}
          >
            <SelectTrigger className="w-full sm:w-28" aria-label="Permission">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERMISSION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="sm"
            disabled={!selectedEmployee || grantMutation.isPending}
            onClick={() =>
              selectedEmployee &&
              grantMutation.mutate({ userId: selectedEmployee, permission: selectedPermission })
            }
          >
            {grantMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Grant
          </Button>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Granted employees {grantedUsers ? `(${grantedUsers.length})` : ""}
          </p>

          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

          {!isLoading && grantedUsers?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No employees granted access yet.
            </p>
          )}

          <div className="flex max-h-64 flex-col gap-1 overflow-auto">
            {grantedUsers?.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/50 px-3 py-2"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{u.fullName}</span>
                  <span className="text-xs text-muted-foreground">{u.employeeId}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Select
                    value={u.permission}
                    onValueChange={(v) =>
                      v &&
                      v !== u.permission &&
                      grantMutation.mutate({
                        userId: u.id,
                        permission: v as AdobeLicenseAccessPermission,
                      })
                    }
                  >
                    <SelectTrigger
                      size="sm"
                      className="h-7 w-24"
                      aria-label={`Permission for ${u.fullName}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERMISSION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Revoke access for ${u.fullName}`}
                    disabled={revokeMutation.isPending}
                    onClick={() => revokeMutation.mutate(u.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
