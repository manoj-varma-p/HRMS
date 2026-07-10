import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const DAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export function WeekdaySelector({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number[];
  onChange: (value: number[]) => void;
}) {
  function toggle(day: number) {
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day].sort());
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {DAYS.map((day) => {
          const selected = value.includes(day.value);
          return (
            <button
              key={day.value}
              type="button"
              onClick={() => toggle(day.value)}
              className={cn(
                "flex h-9 w-12 items-center justify-center rounded-md border text-sm font-medium transition-colors",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-transparent text-muted-foreground hover:bg-accent"
              )}
            >
              {day.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
