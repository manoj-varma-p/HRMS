import { LucideIcon } from "lucide-react";

export function EmptyReportState({
  icon: Icon,
  title,
  hint,
}: {
  icon: LucideIcon;
  title: string;
  hint: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Icon className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}
