"use client";

import { useAuth } from "@/hooks/use-auth";
import { ROLES } from "@/constants/roles";
import { EmployeeDashboard } from "@/features/dashboard/employee-dashboard";
import { AdminDashboard } from "@/features/dashboard/admin-dashboard";

export default function Home() {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN;

  return isAdmin ? <AdminDashboard /> : <EmployeeDashboard />;
}
