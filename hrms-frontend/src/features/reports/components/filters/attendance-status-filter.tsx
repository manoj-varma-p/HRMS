import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ATTENDANCE_STATUS } from "@/constants/attendance-status";
import { ATTENDANCE_STATUS_LABELS } from "@/features/attendance/attendance-status-meta";

const ALL = "ALL";

function toFilterValue(v: string | null): string | undefined {
  return v && v !== ALL ? v : undefined;
}

export function AttendanceStatusFilter({
  value,
  onChange,
}: {
  value?: string;
  onChange: (value?: string) => void;
}) {
  return (
    <Select value={value ?? ALL} onValueChange={(v) => onChange(toFilterValue(v))}>
      <SelectTrigger className="w-full sm:w-40" aria-label="Filter by status">
        <SelectValue placeholder="Status">
          {(v: string) =>
            v === ALL ? "All Statuses" : ATTENDANCE_STATUS_LABELS[v as keyof typeof ATTENDANCE_STATUS_LABELS]
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
  );
}
