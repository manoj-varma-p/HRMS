export interface DashboardKpis {
  totalEmployees: number;
  activeEmployees: number;
  presentToday: number;
  checkedInToday: number;
  notCheckedInToday: number;
  lateToday: number;
  onLeaveToday: number;
  pendingLeaveRequests: number;
}

export interface DailyTrendPoint {
  date: string;
  present: number;
  onLeave: number;
  absent: number;
  isWeekend: boolean;
}

export interface MonthlyTrendPoint {
  month: string;
  present: number;
  leaves: number;
}

export interface LeaveAnalytics {
  byType: { leaveType: string; count: number }[];
  byStatus: { status: string; count: number }[];
}

export interface BreakdownEntry {
  name: string;
  count: number;
}

export interface EmployeeStatusEntry {
  status: string;
  count: number;
}

export interface RecentActivityEntry {
  id: string;
  action: string;
  actorEmployeeId: string;
  targetType: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AdminDashboard {
  kpis: DashboardKpis;
  dailyTrend: DailyTrendPoint[];
  monthlyTrend: MonthlyTrendPoint[];
  leaveAnalytics: LeaveAnalytics;
  departmentBreakdown: BreakdownEntry[];
  designationBreakdown: BreakdownEntry[];
  employeeStatusBreakdown: EmployeeStatusEntry[];
  recentActivity: RecentActivityEntry[];
}
