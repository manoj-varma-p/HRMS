import { getISTDayOfWeek } from "../../shared/utils/istDate";
import { logger } from "../../shared/utils/logger";
import { getOrCreateConfiguration } from "./configuration.service";
import { IConfiguration } from "./configuration.model";

// The rest of the app (attendance, leave, auth) reads company config
// synchronously, many times per request, on hot paths that were written as
// pure functions in earlier phases. Re-fetching from Mongo on every call
// would be both a needless round trip and a signature-breaking change to
// those functions. Instead: load once at server boot, keep an in-memory
// copy, and refresh it after every write through configuration.service.
let cached: IConfiguration | null = null;

// Bounds cross-instance staleness (RC Audit, High finding #3). This cache
// is per-process: an admin's change is picked up immediately by the
// instance that handled the write (refreshConfigCache, below), but any
// *other* running instance won't see it until its own next periodic
// refresh. A short TTL keeps that gap small — never a redesign to a
// shared store, just a ceiling on how stale "the other instance" can be.
// unref()'d so this timer never keeps the process alive on its own (tests,
// graceful shutdown).
const REFRESH_INTERVAL_MS = 30_000;
let refreshTimer: ReturnType<typeof setInterval> | null = null;

function startPeriodicRefresh(): void {
  if (refreshTimer) return;
  refreshTimer = setInterval(() => {
    getOrCreateConfiguration()
      .then((fresh) => {
        cached = fresh;
      })
      .catch((err) => {
        // Transient DB hiccup on a background refresh must not crash the
        // process or wipe an otherwise-good cache — keep serving the last
        // known-good config and try again on the next tick.
        logger.error({ err }, "Periodic Configuration cache refresh failed; keeping last known-good config");
      });
  }, REFRESH_INTERVAL_MS);
  refreshTimer.unref?.();
}

/** For graceful shutdown / test teardown — safe to call even if never started. */
export function stopConfigCacheRefresh(): void {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

export async function loadConfigCache(): Promise<void> {
  cached = await getOrCreateConfiguration();
  startPeriodicRefresh();
}

export async function refreshConfigCache(): Promise<IConfiguration> {
  cached = await getOrCreateConfiguration();
  return cached;
}

function getCachedConfig(): IConfiguration {
  if (!cached) {
    throw new Error(
      "Configuration cache accessed before loadConfigCache() ran at server boot"
    );
  }
  return cached;
}

function parseTimeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function getOfficeHoursMinutes(): {
  startMinutes: number;
  endMinutes: number;
  graceMinutes: number;
  onTimeCutoffMinutes: number;
} {
  const { officeSettings } = getCachedConfig();
  const startMinutes = parseTimeToMinutes(officeSettings.startTime);
  return {
    startMinutes,
    endMinutes: parseTimeToMinutes(officeSettings.endTime),
    graceMinutes: officeSettings.gracePeriodMinutes,
    onTimeCutoffMinutes: startMinutes + officeSettings.gracePeriodMinutes,
  };
}

export function getWeekendDays(): number[] {
  return getCachedConfig().officeSettings.weekendDays;
}

/** Replaces the old Sunday-only isISTSunday check for "is this a non-working day" logic. */
export function isConfiguredWeekend(date: Date): boolean {
  return getWeekendDays().includes(getISTDayOfWeek(date));
}

export function getLeavePolicy() {
  return getCachedConfig().leavePolicy;
}

export function getSecuritySettings() {
  return getCachedConfig().securitySettings;
}

export function getNotificationSettings() {
  return getCachedConfig().notificationSettings;
}

export function getOfficeSettings() {
  return getCachedConfig().officeSettings;
}

export function getCompanyProfile() {
  return getCachedConfig().companyProfile;
}
