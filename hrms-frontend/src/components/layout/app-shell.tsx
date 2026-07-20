import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Topbar } from "@/components/layout/topbar";
import { CompanyLogo } from "@/components/layout/company-logo";
import { NotificationToastListener } from "@/features/notifications/components/notification-toast-listener";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden print:h-auto print:overflow-visible">
      <NotificationToastListener />
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-background md:flex print:hidden">
        <div className="flex h-14 shrink-0 items-center border-b px-4 font-semibold">
          <CompanyLogo />
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col print:block">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 print:h-auto print:overflow-visible print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
