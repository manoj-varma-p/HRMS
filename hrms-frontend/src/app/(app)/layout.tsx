import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/layout/protected-route";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
