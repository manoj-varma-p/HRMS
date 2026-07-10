"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDepartments, useDesignations } from "@/hooks/use-reference-data";
import { ROLES } from "@/constants/roles";
import { EMPLOYEE_STATUS } from "@/constants/employee-status";

const ALL = "ALL";

function toFilterValue(v: string | null): string | undefined {
  return v && v !== ALL ? v : undefined;
}

export interface EmployeeFilterValues {
  search: string;
  department?: string;
  designation?: string;
  role?: string;
  status?: string;
}

interface EmployeeFiltersProps {
  value: EmployeeFilterValues;
  onChange: (value: EmployeeFilterValues) => void;
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  NOTICE_PERIOD: "Notice Period",
  RESIGNED: "Resigned",
  TERMINATED: "Terminated",
};

const ROLE_LABELS: Record<string, string> = {
  EMPLOYEE: "Employee",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
};

export function EmployeeFilters({ value, onChange }: EmployeeFiltersProps) {
  const { data: departments } = useDepartments();
  const { data: designations } = useDesignations();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by ID, name, email, phone"
          className="pl-8"
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
        />
      </div>

      <Select
        value={value.department ?? ALL}
        onValueChange={(v) => onChange({ ...value, department: toFilterValue(v) })}
      >
        <SelectTrigger className="w-full sm:w-44" aria-label="Filter by department">
          <SelectValue placeholder="Department">
            {(v: string) =>
              v === ALL ? "All Departments" : departments?.find((d) => d._id === v)?.name
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All Departments</SelectItem>
          {departments?.map((d) => (
            <SelectItem key={d._id} value={d._id}>
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.designation ?? ALL}
        onValueChange={(v) => onChange({ ...value, designation: toFilterValue(v) })}
      >
        <SelectTrigger className="w-full sm:w-44" aria-label="Filter by designation">
          <SelectValue placeholder="Designation">
            {(v: string) =>
              v === ALL ? "All Designations" : designations?.find((d) => d._id === v)?.name
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All Designations</SelectItem>
          {designations?.map((d) => (
            <SelectItem key={d._id} value={d._id}>
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.role ?? ALL}
        onValueChange={(v) => onChange({ ...value, role: toFilterValue(v) })}
      >
        <SelectTrigger className="w-full sm:w-36" aria-label="Filter by role">
          <SelectValue placeholder="Role">
            {(v: string) => (v === ALL ? "All Roles" : ROLE_LABELS[v])}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All Roles</SelectItem>
          {Object.values(ROLES).map((r) => (
            <SelectItem key={r} value={r}>
              {ROLE_LABELS[r]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.status ?? ALL}
        onValueChange={(v) => onChange({ ...value, status: toFilterValue(v) })}
      >
        <SelectTrigger className="w-full sm:w-40" aria-label="Filter by status">
          <SelectValue placeholder="Status">
            {(v: string) => (v === ALL ? "All Statuses" : STATUS_LABELS[v])}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All Statuses</SelectItem>
          {Object.values(EMPLOYEE_STATUS).map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
