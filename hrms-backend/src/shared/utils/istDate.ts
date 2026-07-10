const IST_TIMEZONE = "Asia/Kolkata";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: IST_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const TIME_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  timeZone: IST_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: IST_TIMEZONE,
  weekday: "short",
});

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Returns the IST calendar date as "YYYY-MM-DD". */
export function getISTDateString(date: Date = new Date()): string {
  return DATE_FORMATTER.format(date);
}

/** Returns minutes since IST midnight (0-1439). */
export function getISTMinutesOfDay(date: Date): number {
  const parts = TIME_FORMATTER.formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

/** 0 = Sunday ... 6 = Saturday, in IST. */
export function getISTDayOfWeek(date: Date): number {
  return WEEKDAY_INDEX[WEEKDAY_FORMATTER.format(date)] ?? 0;
}

export function isISTSunday(date: Date): boolean {
  return getISTDayOfWeek(date) === 0;
}

/** Difference in hours (2 decimal places) between two timestamps. */
export function diffInHours(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.round((ms / (1000 * 60 * 60)) * 100) / 100;
}

/** Generates "YYYY-MM-DD" strings for every day in [start, end], inclusive. */
export function enumerateISTDateStrings(start: string, end: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${start}T00:00:00+05:30`);
  const endDate = new Date(`${end}T00:00:00+05:30`);
  while (cursor.getTime() <= endDate.getTime()) {
    dates.push(getISTDateString(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

/**
 * First/last "YYYY-MM-DD" of a "YYYY-MM" month. Uses Date.UTC throughout
 * (not local time) so it's independent of the server's runtime timezone —
 * day 0 of the following month is always the last day of this one.
 */
export function getMonthBounds(yearMonth: string): { start: string; end: string } {
  const [year, month] = yearMonth.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    start: `${yearMonth}-01`,
    end: `${yearMonth}-${String(lastDay).padStart(2, "0")}`,
  };
}

/** Whole days between two "YYYY-MM-DD" strings (positive if b is after a). */
export function daysBetweenDateStrings(a: string, b: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((Date.parse(b) - Date.parse(a)) / msPerDay);
}
