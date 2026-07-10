import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LEAVE_TYPES } from "@/constants/leave-types";

const ALL = "ALL";

function toFilterValue(v: string | null): string | undefined {
  return v && v !== ALL ? v : undefined;
}

const LABELS: Record<string, string> = {
  SICK: "Sick",
  CASUAL_PAID: "Casual / Paid",
  UNPAID: "Unpaid",
};

export function LeaveTypeFilter({
  value,
  onChange,
}: {
  value?: string;
  onChange: (value?: string) => void;
}) {
  return (
    <Select value={value ?? ALL} onValueChange={(v) => onChange(toFilterValue(v))}>
      <SelectTrigger className="w-full sm:w-40" aria-label="Filter by leave type">
        <SelectValue placeholder="Leave Type">
          {(v: string) => (v === ALL ? "All Leave Types" : LABELS[v])}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All Leave Types</SelectItem>
        {Object.values(LEAVE_TYPES).map((t) => (
          <SelectItem key={t} value={t}>
            {LABELS[t]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
