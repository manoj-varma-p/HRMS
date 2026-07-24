import Link from "next/link";
import { ClipboardList, CalendarDays, Users, Building2, CalendarRange, type LucideIcon } from "lucide-react";
import { RoleGuard } from "@/components/layout/role-guard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ROLES } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";

interface ReportCard {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

const REPORT_CARDS: ReportCard[] = [
  {
    title: "Attendance Report",
    description: "Daily check-in, check-out, and status records across all employees.",
    href: ROUTES.REPORTS_ATTENDANCE,
    icon: ClipboardList,
  },
  {
    title: "Leave Report",
    description: "Leave requests with type, status, and review history.",
    href: ROUTES.REPORTS_LEAVE,
    icon: CalendarDays,
  },
  {
    title: "Employee Report",
    description: "Employee directory with attendance and leave usage.",
    href: ROUTES.REPORTS_EMPLOYEES,
    icon: Users,
  },
  {
    title: "Department Report",
    description: "Headcount and attendance performance by department.",
    href: ROUTES.REPORTS_DEPARTMENTS,
    icon: Building2,
  },
  {
    title: "Monthly Summary Report",
    description: "Per-employee attendance summary for a selected month.",
    href: ROUTES.REPORTS_MONTHLY_SUMMARY,
    icon: CalendarRange,
  },
];

export default function ReportsPage() {
  return (
    <RoleGuard allow={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">
            View, filter, export, and print reports across attendance, leave, and employee data.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REPORT_CARDS.map((card) => (
            <Link key={card.href} href={card.href} className="group block h-full">
              <Card className="h-full border border-border/40 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:bg-white group-hover:text-black group-hover:border-transparent group-hover:-translate-y-1 group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.2)]">
                <CardHeader>
                  <card.icon className="h-6 w-6 text-muted-foreground transition-colors duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:text-black/80" />
                  <CardTitle className="mt-2 transition-colors duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:text-black">{card.title}</CardTitle>
                  <CardDescription className="transition-colors duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:text-black/60">{card.description}</CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </RoleGuard>
  );
}
