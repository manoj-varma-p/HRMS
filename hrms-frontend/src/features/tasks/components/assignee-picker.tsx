"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssignableEmployees } from "@/hooks/use-assignable-employees";

interface AssigneePickerProps {
  value?: string;
  onChange: (employeeId: string) => void;
  disabled?: boolean;
}

// Scoping (Admin/Super Admin: anyone; Department Head: only their own
// department) is handled entirely server-side by GET /employees/assignable
// — this component just renders whatever it's given, no client-side
// filtering needed.
const UNSET = "";

export function AssigneePicker({ value, onChange, disabled }: AssigneePickerProps) {
  const { data: employees, isLoading } = useAssignableEmployees();
  const options = employees ?? [];

  return (
    <Select
      // Always a string, never undefined — Base UI (like React generally)
      // fixes a component's controlled/uncontrolled nature on first render;
      // a caller whose own local state starts as undefined (e.g.
      // TaskReassignDialog) would otherwise flip this Select from
      // uncontrolled to controlled the moment a selection is made.
      value={value ?? UNSET}
      onValueChange={(v) => v && onChange(v)}
      disabled={disabled || isLoading}
    >
      <SelectTrigger aria-label="Assignee" className="w-full">
        <SelectValue placeholder="Select an assignee">
          {(v: string) => {
            if (v === UNSET) return undefined;
            const employee = options.find((e) => e.id === v);
            return employee ? `${employee.fullName} (${employee.employeeId})` : undefined;
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((e) => (
          <SelectItem key={e.id} value={e.id}>
            {e.fullName} ({e.employeeId})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
