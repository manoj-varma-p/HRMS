"use client";

import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDepartments, useDesignations } from "@/hooks/use-reference-data";
import { ATTENDANCE_STATUS } from "@/constants/attendance-status";
import { ATTENDANCE_STATUS_LABELS } from "../attendance-status-meta";
import * as employeeService from "@/services/employee.service";

const ALL = "ALL";
function toFilterValue(v: string | null): string | undefined {
  return v && v !== ALL ? v : undefined;
}

export interface AdminAttendanceFilterValues {
  date?: string;
  year: number;
  month: number;
  department?: string;
  designation?: string;
  employeeId?: string;
  status?: string;
}

interface AdminAttendanceFiltersProps {
  value: AdminAttendanceFilterValues;
  onChange: (value: AdminAttendanceFilterValues) => void;
  onExport: () => void;
  exporting: boolean;
}

function useEmployeeOptions() {
  return useQuery({
    queryKey: ["employees-for-filter"],
    queryFn: () =>
      employeeService
        .listEmployees({ limit: 100, sortBy: "fullName", sortOrder: "asc" })
        .then((res) => res.data.employees),
  });
}

export function AdminAttendanceFilters({
  value,
  onChange,
  onExport,
  exporting,
}: AdminAttendanceFiltersProps) {
  const { data: departments } = useDepartments();
  const { data: designations } = useDesignations();
  const { data: employees } = useEmployeeOptions();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="date"
          className="w-full sm:w-40"
          value={value.date ?? ""}
          onChange={(e) => onChange({ ...value, date: e.target.value || undefined })}
        />
        <Select
          value={String(value.month)}
          onValueChange={(v) => onChange({ ...value, month: Number(v), date: undefined })}
        >
          <SelectTrigger className="w-full sm:w-32" aria-label="Month">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }).map((_, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>
                {new Date(2000, i, 1).toLocaleDateString("en-US", { month: "long" })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          className="w-full sm:w-24"
          value={value.year}
          onChange={(e) => onChange({ ...value, year: Number(e.target.value), date: undefined })}
        />

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
          value={value.employeeId ?? ALL}
          onValueChange={(v) => onChange({ ...value, employeeId: toFilterValue(v) })}
        >
          <SelectTrigger className="w-full sm:w-48" aria-label="Filter by employee">
            <SelectValue placeholder="Employee">
              {(v: string) =>
                v === ALL
                  ? "All Employees"
                  : employees?.find((e) => e.id === v)?.fullName
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Employees</SelectItem>
            {employees?.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.fullName} ({e.employeeId})
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
              {(v: string) =>
                v === ALL
                  ? "All Statuses"
                  : ATTENDANCE_STATUS_LABELS[v as keyof typeof ATTENDANCE_STATUS_LABELS]
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Statuses</SelectItem>
            {Object.values(ATTENDANCE_STATUS).map((s) => (
              <SelectItem key={s} value={s}>
                {ATTENDANCE_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={onExport} disabled={exporting} className="ml-auto">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>
    </div>
  );
}
