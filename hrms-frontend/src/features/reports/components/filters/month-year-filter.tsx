"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function monthRange(year: number, month: number): { startDate: string; endDate: string } {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { startDate, endDate };
}

/**
 * A quick "jump to this month/year" control — applying it overwrites the
 * date range with the selected month's first/last day. Sits alongside
 * DateRangeFilter (for custom ranges) rather than replacing it.
 */
export function MonthYearFilter({
  onApply,
}: {
  onApply: (range: { startDate: string; endDate: string }) => void;
}) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  return (
    <div className="flex items-center gap-2">
      <Select
        value={String(month)}
        onValueChange={(v) => {
          const nextMonth = Number(v);
          setMonth(nextMonth);
          onApply(monthRange(year, nextMonth));
        }}
      >
        <SelectTrigger className="w-full sm:w-32" aria-label="Jump to month">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 12 }).map((_, i) => (
            <SelectItem key={i + 1} value={String(i + 1)}>
              {new Date(2000, i, 1).toLocaleDateString("en-US", { month: "long" })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="number"
        className="w-full sm:w-24"
        aria-label="Jump to year"
        value={year}
        onChange={(e) => {
          const nextYear = Number(e.target.value);
          setYear(nextYear);
          if (nextYear) onApply(monthRange(nextYear, month));
        }}
      />
    </div>
  );
}
