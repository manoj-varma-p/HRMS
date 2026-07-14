import { ClipboardList, LucideIcon } from "lucide-react";

export function TaskEmptyState({
  message,
  icon: Icon = ClipboardList,
}: {
  message: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <Icon className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
