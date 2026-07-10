import { Input } from "@/components/ui/input";

export interface DateRangeValue {
  startDate?: string;
  endDate?: string;
}

export function DateRangeFilter({
  value,
  onChange,
}: {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Input
        type="date"
        aria-label="Start date"
        className="w-full sm:w-40"
        value={value.startDate ?? ""}
        onChange={(e) => onChange({ ...value, startDate: e.target.value || undefined })}
      />
      <span className="text-sm text-muted-foreground">to</span>
      <Input
        type="date"
        aria-label="End date"
        className="w-full sm:w-40"
        value={value.endDate ?? ""}
        onChange={(e) => onChange({ ...value, endDate: e.target.value || undefined })}
      />
    </div>
  );
}
