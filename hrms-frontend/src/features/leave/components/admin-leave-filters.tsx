"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDepartments, useDesignations } from "@/hooks/use-reference-data";
import { LEAVE_REQUEST_STATUS, LEAVE_TYPES } from "@/constants/leave-types";
import { LEAVE_TYPE_LABELS } from "../leave-status-meta";

const ALL = "ALL";
function toFilterValue(v: string | null): string | undefined {
  return v && v !== ALL ? v : undefined;
}

export interface AdminLeaveFilterValues {
  status?: string;
  leaveType?: string;
  department?: string;
  designation?: string;
  year?: number;
}

interface AdminLeaveFiltersProps {
  value: AdminLeaveFilterValues;
  onChange: (value: AdminLeaveFilterValues) => void;
}

export function AdminLeaveFilters({ value, onChange }: AdminLeaveFiltersProps) {
  const { data: departments } = useDepartments();
  const { data: designations } = useDesignations();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={value.status ?? ALL}
        onValueChange={(v) => onChange({ ...value, status: toFilterValue(v) })}
      >
        <SelectTrigger className="w-full sm:w-40" aria-label="Filter by status">
          <SelectValue placeholder="Status">
            {(v: string) => (v === ALL ? "All Statuses" : v)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All Statuses</SelectItem>
          {Object.values(LEAVE_REQUEST_STATUS).map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.leaveType ?? ALL}
        onValueChange={(v) => onChange({ ...value, leaveType: toFilterValue(v) })}
      >
        <SelectTrigger className="w-full sm:w-44" aria-label="Filter by leave type">
          <SelectValue placeholder="Leave Type">
            {(v: string) => (v === ALL ? "All Types" : LEAVE_TYPE_LABELS[v])}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All Types</SelectItem>
          {Object.values(LEAVE_TYPES).map((t) => (
            <SelectItem key={t} value={t}>
              {LEAVE_TYPE_LABELS[t]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
    </div>
  );
}
