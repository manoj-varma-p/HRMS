import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accentClassName?: string;
  hint?: string;
}

export function StatCard({ label, value, icon: Icon, accentClassName, hint }: StatCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-sm">
      <CardContent className="flex items-center gap-4 py-1">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary",
            accentClassName
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-semibold tabular-nums">{value}</span>
          <span className="text-xs text-muted-foreground">{label}</span>
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
