"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import * as employeeService from "@/services/employee.service";

const GRID_DOTS_STYLE: React.CSSProperties = {
  backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)",
  backgroundSize: "1rem 1rem",
  maskImage: "radial-gradient(ellipse 70% 100% at 100% 0%, black, transparent)",
  WebkitMaskImage: "radial-gradient(ellipse 70% 100% at 100% 0%, black, transparent)",
};

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);
  return now;
}

function getGreetingName(fullName: string): string {
  if (!fullName) return "";
  const parts = fullName.trim().split(/\s+/);
  const firstMain = parts.find((p) => p.replace(/\./g, "").length > 2);
  if (firstMain) {
    const idx = parts.indexOf(firstMain);
    if (idx > 0) {
      return parts.slice(0, idx + 1).join(" ");
    }
    return firstMain;
  }
  return parts[0];
}

export function WelcomeHeader() {
  const now = useClock();
  const { data } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => employeeService.getMyProfile().then((res) => res.data.employee),
  });

  const greeting = (() => {
    const hour = now?.getHours() ?? 12;
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-linear-to-br from-muted/40 to-background p-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-30"
        style={GRID_DOTS_STYLE}
      />

      <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting}
            {data ? (
              <>
                ,{" "}
                <span className="bg-linear-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  {getGreetingName(data.fullName)}
                </span>
              </>
            ) : (
              ""
            )}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data?.designation?.name ?? "—"} · {data?.department?.name ?? "—"}
          </p>
        </div>

        {now && (
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/70 px-4 py-2.5 backdrop-blur-sm">
            <Clock className="h-4 w-4 text-primary" />
            <div className="text-right">
              <p className="text-sm font-semibold tabular-nums">
                {now.toLocaleTimeString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                IST
              </p>
              <p className="text-xs text-muted-foreground">
                {now.toLocaleDateString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
