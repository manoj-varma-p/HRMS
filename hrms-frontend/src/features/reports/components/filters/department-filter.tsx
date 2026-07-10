"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDepartments } from "@/hooks/use-reference-data";

const ALL = "ALL";

function toFilterValue(v: string | null): string | undefined {
  return v && v !== ALL ? v : undefined;
}

export function DepartmentFilter({
  value,
  onChange,
}: {
  value?: string;
  onChange: (value?: string) => void;
}) {
  const { data: departments } = useDepartments();

  return (
    <Select value={value ?? ALL} onValueChange={(v) => onChange(toFilterValue(v))}>
      <SelectTrigger className="w-full sm:w-44" aria-label="Filter by department">
        <SelectValue placeholder="Department">
          {(v: string) => (v === ALL ? "All Departments" : departments?.find((d) => d._id === v)?.name)}
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
  );
}
