import { logger } from "../../shared/utils/logger";
import { DepartmentModel } from "./department.model";

// Mirrors configuration.cache.ts's pattern exactly: auth.service.ts needs
// "which departments does this employee head" on every login/refresh/getMe
// call, and that must not cost a DB round trip each time (see Phase 0
// design discussion — minimizing auth-time queries was explicit). Load
// once at server boot, keep an in-memory copy, refresh it whenever a head
// assignment actually changes (a rare admin action) plus a periodic
// safety-net refresh for multi-instance staleness, same bound as
// Configuration's cache.
let cached: Map<string, { id: string; name: string }[]> | null = null;

const REFRESH_INTERVAL_MS = 30_000;
let refreshTimer: ReturnType<typeof setInterval> | null = null;

async function loadFromDb(): Promise<Map<string, { id: string; name: string }[]>> {
  const departments = await DepartmentModel.find({ headEmployeeId: { $ne: null } }).select(
    "name headEmployeeId"
  );

  const map = new Map<string, { id: string; name: string }[]>();
  for (const dept of departments) {
    const headId = String(dept.headEmployeeId);
    const entry = { id: String(dept._id), name: dept.name };
    const existing = map.get(headId);
    if (existing) {
      existing.push(entry);
    } else {
      map.set(headId, [entry]);
    }
  }
  return map;
}

function startPeriodicRefresh(): void {
  if (refreshTimer) return;
  refreshTimer = setInterval(() => {
    loadFromDb()
      .then((fresh) => {
        cached = fresh;
      })
      .catch((err) => {
        logger.error(
          { err },
          "Periodic Department Head cache refresh failed; keeping last known-good data"
        );
      });
  }, REFRESH_INTERVAL_MS);
  refreshTimer.unref?.();
}

/** For graceful shutdown / test teardown — safe to call even if never started. */
export function stopDepartmentHeadsCacheRefresh(): void {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

export async function loadDepartmentHeadsCache(): Promise<void> {
  cached = await loadFromDb();
  startPeriodicRefresh();
}

export async function refreshDepartmentHeadsCache(): Promise<void> {
  cached = await loadFromDb();
}

/**
 * Synchronous, zero-DB-query lookup — the entire point of this cache.
 * Returns [] (not an error) if the cache hasn't loaded yet, so a cold
 * boot race can't crash auth; it's self-correcting within one refresh
 * cycle at worst.
 */
export function getDepartmentsHeadedBy(employeeId: string): { id: string; name: string }[] {
  if (!cached) {
    logger.error("Department Head cache accessed before loadDepartmentHeadsCache() ran at server boot");
    return [];
  }
  return cached.get(employeeId) ?? [];
}
