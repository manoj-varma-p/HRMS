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
import { useDepartments } from "@/hooks/use-reference-data";
import { useAssignableEmployees } from "@/hooks/use-assignable-employees";
import { TaskPriority, TaskStatus } from "@/types/task.types";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "../task-status-meta";

const ALL = "ALL";
function toFilterValue(v: string | null): string | undefined {
  return v && v !== ALL ? v : undefined;
}

export interface TaskFilterValues {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  department?: string;
  search?: string;
}

interface TaskFiltersProps {
  /** "team" hides Department/Search (implicit to the head's own team; matches TDS's stated Phase 3 filter set). */
  scope: "team" | "admin";
  value: TaskFilterValues;
  onChange: (value: TaskFilterValues) => void;
}

export function TaskFilters({ scope, value, onChange }: TaskFiltersProps) {
  const { data: departments } = useDepartments();
  // Scoping (Admin/Super Admin: anyone; Department Head: only their own
  // department) is handled server-side by GET /employees/assignable.
  const { data: assignableEmployeesData } = useAssignableEmployees();
  const assignableEmployees = assignableEmployeesData ?? [];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      {scope === "admin" && (
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks"
            className="pl-8"
            value={value.search ?? ""}
            onChange={(e) => onChange({ ...value, search: e.target.value || undefined })}
          />
        </div>
      )}

      <Select
        value={value.status ?? ALL}
        onValueChange={(v) => onChange({ ...value, status: toFilterValue(v) as TaskStatus })}
      >
        <SelectTrigger className="w-full sm:w-40" aria-label="Filter by status">
          <SelectValue placeholder="Status">
            {(v: string) => (v === ALL ? "All Statuses" : TASK_STATUS_LABELS[v as TaskStatus])}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All Statuses</SelectItem>
          {Object.entries(TASK_STATUS_LABELS).map(([v, label]) => (
            <SelectItem key={v} value={v}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.priority ?? ALL}
        onValueChange={(v) => onChange({ ...value, priority: toFilterValue(v) as TaskPriority })}
      >
        <SelectTrigger className="w-full sm:w-40" aria-label="Filter by priority">
          <SelectValue placeholder="Priority">
            {(v: string) =>
              v === ALL ? "All Priorities" : TASK_PRIORITY_LABELS[v as TaskPriority]
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All Priorities</SelectItem>
          {Object.entries(TASK_PRIORITY_LABELS).map(([v, label]) => (
            <SelectItem key={v} value={v}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.assignedTo ?? ALL}
        onValueChange={(v) => onChange({ ...value, assignedTo: toFilterValue(v) })}
      >
        <SelectTrigger className="w-full sm:w-44" aria-label="Filter by assignee">
          <SelectValue placeholder="Assignee">
            {(v: string) =>
              v === ALL ? "All Assignees" : assignableEmployees.find((e) => e.id === v)?.fullName
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All Assignees</SelectItem>
          {assignableEmployees.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.fullName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {scope === "admin" && (
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
      )}
    </div>
  );
}
