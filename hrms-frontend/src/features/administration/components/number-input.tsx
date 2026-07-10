import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NumberInput({
  id,
  label,
  description,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
}: {
  id: string;
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="number"
          className="w-32"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
