"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEmployeeOptions } from "@/hooks/use-employee-options";

const ALL = "ALL";

function toFilterValue(v: string | null): string | undefined {
  return v && v !== ALL ? v : undefined;
}

export function EmployeeFilter({
  value,
  onChange,
}: {
  value?: string;
  onChange: (value?: string) => void;
}) {
  const { data: employees } = useEmployeeOptions();

  return (
    <Select value={value ?? ALL} onValueChange={(v) => onChange(toFilterValue(v))}>
      <SelectTrigger className="w-full sm:w-48" aria-label="Filter by employee">
        <SelectValue placeholder="Employee">
          {(v: string) => (v === ALL ? "All Employees" : employees?.find((e) => e.id === v)?.fullName)}
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
  );
}
