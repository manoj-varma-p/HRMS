import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function ToggleRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <div className="flex flex-col gap-0.5">
        <Label htmlFor={id}>{label}</Label>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}
