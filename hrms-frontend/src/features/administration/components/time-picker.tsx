import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TimePicker({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="time" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
