"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as employeeService from "@/services/employee.service";

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);
  return now;
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
    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting}
          {data ? `, ${data.fullName.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          {data?.designation?.name ?? "—"} · {data?.department?.name ?? "—"}
        </p>
      </div>
      {now && (
        <div className="text-right">
          <p className="text-sm font-medium">
            {now.toLocaleDateString("en-IN", {
              timeZone: "Asia/Kolkata",
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className="text-xs text-muted-foreground">
            {now.toLocaleTimeString("en-IN", {
              timeZone: "Asia/Kolkata",
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            IST
          </p>
        </div>
      )}
    </div>
  );
}
