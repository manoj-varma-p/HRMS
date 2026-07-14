import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LoginHero } from "@/features/auth/components/login-hero";
import { LoginBrandMarkCompact } from "@/features/auth/components/login-brand-mark";

export default function AuthGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const year = new Date().getFullYear();

  return (
    <div className="grid min-h-screen md:grid-cols-12">
      <LoginHero />

      <div className="flex flex-col justify-between p-6 sm:p-10 md:col-span-6 md:p-12 lg:col-span-5">
        <div className="mb-8 flex w-full items-center justify-between md:mb-0 md:justify-end">
          <div className="md:hidden">
            <LoginBrandMarkCompact />
          </div>
          <ThemeToggle />
        </div>

        <div className="mx-auto flex w-full max-w-85 flex-col justify-center gap-6 md:my-auto">
          {children}
        </div>

        <p className="mt-8 block text-center text-xs text-muted-foreground md:hidden">
          &copy; {year} TAC Attendance.
        </p>
      </div>
    </div>
  );
}
