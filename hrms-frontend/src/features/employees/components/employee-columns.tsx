"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, PowerOff, Power, Eye, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Employee } from "@/types/employee.types";
import { EmployeeStatusBadge } from "./employee-status-badge";

interface EmployeeColumnHandlers {
  onView: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onActivate: (employee: Employee) => void;
  onDeactivate: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  canDelete: (employee: Employee) => boolean;
}

const ROLE_LABELS: Record<string, string> = {
  EMPLOYEE: "Employee",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function getEmployeeColumns(
  handlers: EmployeeColumnHandlers
): ColumnDef<Employee>[] {
  return [
    {
      id: "profile",
      header: "",
      cell: ({ row }) => (
        <Avatar className="h-8 w-8">
          <AvatarImage src={row.original.profilePhoto ?? undefined} />
          <AvatarFallback>{getInitials(row.original.fullName)}</AvatarFallback>
        </Avatar>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "employeeId",
      header: "Employee ID",
    },
    {
      accessorKey: "fullName",
      header: "Full Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.fullName}</span>
          <span className="text-xs text-muted-foreground">
            {row.original.email}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      id: "department",
      header: "Department",
      cell: ({ row }) => row.original.department?.name ?? "—",
    },
    {
      id: "designation",
      header: "Designation",
      cell: ({ row }) => row.original.designation?.name ?? "—",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => ROLE_LABELS[row.original.role] ?? row.original.role,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <EmployeeStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "joiningDate",
      header: "Joining Date",
      cell: ({ row }) =>
        new Date(row.original.joiningDate).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const employee = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon" />}
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handlers.onView(employee)}>
                <Eye className="h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlers.onEdit(employee)}>
                <Pencil className="h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {employee.status === "ACTIVE" ? (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => handlers.onDeactivate(employee)}
                >
                  <PowerOff className="h-4 w-4" />
                  Deactivate
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => handlers.onActivate(employee)}>
                  <Power className="h-4 w-4" />
                  Activate
                </DropdownMenuItem>
              )}
              {handlers.canDelete(employee) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => handlers.onDelete(employee)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
    },
  ];
}
