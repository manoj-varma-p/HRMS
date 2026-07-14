import { Calendar, Users } from "lucide-react";
import { LoginBrandMark } from "./login-brand-mark";

const GRID_LINES_STYLE: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
  backgroundSize: "4rem 4rem",
  maskImage: "radial-gradient(ellipse 60% 50% at center, black, transparent)",
  WebkitMaskImage: "radial-gradient(ellipse 60% 50% at center, black, transparent)",
};

const GRID_DOTS_STYLE: React.CSSProperties = {
  backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)",
  backgroundSize: "1rem 1rem",
};

const FEATURES = [
  {
    icon: Calendar,
    title: "Real-time Attendance",
    description: "Clock-in, track hours, and monitor shifts dynamically.",
  },
  {
    icon: Users,
    title: "Employee Directory",
    description: "Streamline profiles, roles, and administrative data.",
  },
];

export function LoginHero() {
  const year = new Date().getFullYear();

  return (
    <div className="relative hidden flex-col overflow-hidden border-r border-border/50 bg-muted/20 p-10 md:col-span-6 md:flex lg:col-span-7 lg:p-14">
      <div className="pointer-events-none absolute inset-0 opacity-35 dark:opacity-20" style={GRID_LINES_STYLE} />
      <div className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-25" style={GRID_DOTS_STYLE} />

      <div className="relative z-10">
        <LoginBrandMark />
      </div>

      <div className="relative z-10 my-auto max-w-xl space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          Next-Gen Workspace
        </div>

        <h1 className="text-4xl leading-[1.1] font-extrabold tracking-tight lg:text-5xl">
          <span className="block">Empower Your Team.</span>
          <span className="block bg-linear-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Simplify Your Workflow.
          </span>
        </h1>

        <p className="text-base text-muted-foreground">
          Manage attendance, employee directory, leaves, profile settings, and system
          configurations under one unified platform.
        </p>

        <div className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-border bg-background/50 p-4 shadow-sm transition-all duration-300 hover:border-primary/50 hover:shadow-md"
            >
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-between text-xs text-muted-foreground">
        <span>&copy; {year} TAC Attendance.</span>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:underline">
            Privacy Policy
          </a>
          <a href="#" className="hover:underline">
            Terms
          </a>
        </div>
      </div>
    </div>
  );
}
