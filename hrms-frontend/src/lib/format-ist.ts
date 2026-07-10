const IST_TIMEZONE = "Asia/Kolkata";

export function formatISTTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", {
    timeZone: IST_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatISTDate(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00+05:30`).toLocaleDateString("en-IN", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatWorkedHours(hours: number | null): string {
  if (hours === null || hours === undefined) return "—";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}
