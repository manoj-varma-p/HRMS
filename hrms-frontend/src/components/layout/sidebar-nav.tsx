"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Users,
  Megaphone,
  FileBarChart,
  History,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { ROLES, Role } from "@/constants/roles";
import { useAuth } from "@/hooks/use-auth";

const navItems = [
  { label: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: "Attendance", href: ROUTES.ATTENDANCE, icon: CalendarCheck },
  { label: "Leave", href: ROUTES.LEAVE, icon: CalendarDays },
  { label: "Tasks", href: ROUTES.TASKS, icon: ClipboardList },
  {
    label: "Employees",
    href: ROUTES.EMPLOYEES,
    icon: Users,
    allow: [ROLES.ADMIN, ROLES.SUPER_ADMIN] as Role[],
  },
  {
    label: "Reports",
    href: ROUTES.REPORTS,
    icon: FileBarChart,
    allow: [ROLES.ADMIN, ROLES.SUPER_ADMIN] as Role[],
  },
  { label: "Announcements", href: ROUTES.ANNOUNCEMENTS, icon: Megaphone },
  {
    label: "Activity Center",
    href: ROUTES.ACTIVITY,
    icon: History,
    allow: [ROLES.ADMIN, ROLES.SUPER_ADMIN] as Role[],
  },
  {
    label: "Administration",
    href: ROUTES.ADMINISTRATION,
    icon: ShieldCheck,
    allow: [ROLES.ADMIN, ROLES.SUPER_ADMIN] as Role[],
  },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const visibleItems = navItems.filter(
    (item) => !item.allow || (user && item.allow.includes(user.role))
  );

  return (
    <nav className="flex flex-col gap-1 p-3">
      {visibleItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
