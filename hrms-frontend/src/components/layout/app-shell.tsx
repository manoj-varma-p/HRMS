import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Topbar } from "@/components/layout/topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r bg-background md:block print:hidden">
        <div className="flex h-14 items-center border-b px-4 font-semibold">
          HRMS
        </div>
        <SidebarNav />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
