"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarHeart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import * as holidayService from "@/services/holiday.service";
import { formatISTDate } from "@/lib/format-ist";

export function UpcomingHolidays() {
  const year = new Date().getFullYear();
  const { data, isLoading } = useQuery({
    queryKey: ["holidays", "upcoming", year],
    queryFn: () => holidayService.listHolidays({ year }),
  });

  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const upcoming = (data ?? [])
    .filter((h) => h.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Upcoming Holidays</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-24 w-full" />}

        {!isLoading && upcoming.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <CalendarHeart className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No upcoming holidays.</p>
          </div>
        )}

        {!isLoading && upcoming.length > 0 && (
          <div className="flex flex-col divide-y">
            {upcoming.map((h) => (
              <div
                key={h._id}
                className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{h.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatISTDate(h.date)}
                  </span>
                </div>
                <Badge variant="secondary">{h.type === "NATIONAL" ? "National" : "Company"}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
