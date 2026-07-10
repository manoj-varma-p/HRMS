import { Badge } from "@/components/ui/badge";
import { EmployeeStatus } from "@/constants/employee-status";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<EmployeeStatus, string> = {
  ACTIVE:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent",
  INACTIVE: "bg-muted text-muted-foreground border-transparent",
  NOTICE_PERIOD:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-transparent",
  RESIGNED:
    "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-transparent",
  TERMINATED: "bg-red-500/10 text-red-600 dark:text-red-400 border-transparent",
};

const STATUS_LABELS: Record<EmployeeStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  NOTICE_PERIOD: "Notice Period",
  RESIGNED: "Resigned",
  TERMINATED: "Terminated",
};

export function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  return (
    <Badge variant="outline" className={cn(STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
