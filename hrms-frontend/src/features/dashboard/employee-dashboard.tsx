"use client";

import { useState } from "react";
import { CalendarDays, CalendarPlus, ClipboardList, UserCog } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { DayStatusEntry } from "@/types/attendance.types";
import { TodayStatusCard } from "@/features/attendance/components/today-status-card";
import { MonthSummaryCard } from "@/features/attendance/components/month-summary-card";
import { AttendanceCalendar } from "@/features/attendance/components/attendance-calendar";
import { AttendanceDayDialog } from "@/features/attendance/components/attendance-day-dialog";
import { CorrectionRequestDialog } from "@/features/attendance/components/correction-request-dialog";
import { LeaveBalanceCard } from "@/features/leave/components/leave-balance-card";
import { RecentAnnouncementsWidget } from "@/features/announcements/components/recent-announcements-widget";
import { WelcomeHeader } from "./components/welcome-header";
import { RecentLeaveRequests } from "./components/recent-leave-requests";
import { UpcomingHolidays } from "./components/upcoming-holidays";
import { QuickActions } from "./components/quick-actions";
import { DashboardSection } from "./components/dashboard-section";

const QUICK_ACTIONS = [
  { label: "Apply Leave", href: ROUTES.LEAVE, icon: CalendarPlus },
  { label: "View Attendance", href: ROUTES.ATTENDANCE, icon: CalendarDays },
  { label: "Leave History", href: ROUTES.LEAVE, icon: ClipboardList },
  { label: "Edit Profile", href: ROUTES.PROFILE, icon: UserCog },
];

export function EmployeeDashboard() {
  const [selectedDay, setSelectedDay] = useState<DayStatusEntry | null>(null);
  const [correctionDate, setCorrectionDate] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <WelcomeHeader />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TodayStatusCard />
        <MonthSummaryCard />
        <LeaveBalanceCard />
      </div>

      <DashboardSection title="This Month">
        <AttendanceCalendar onDayClick={setSelectedDay} />
      </DashboardSection>

      <div className="grid gap-4 sm:grid-cols-2">
        <RecentLeaveRequests />
        <UpcomingHolidays />
      </div>

      <RecentAnnouncementsWidget />

      <QuickActions actions={QUICK_ACTIONS} />

      <AttendanceDayDialog
        day={selectedDay}
        onClose={() => setSelectedDay(null)}
        onRequestCorrection={(day) => {
          setCorrectionDate(day.date);
          setSelectedDay(null);
        }}
      />
      <CorrectionRequestDialog date={correctionDate} onClose={() => setCorrectionDate(null)} />
    </div>
  );
}
