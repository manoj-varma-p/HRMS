import { LEAVE_TYPES } from "./leaveTypes";

// Superseded in Phase 9 by Configuration.leavePolicy (see
// modules/configuration) — leave.service now reads quotas via
// configuration.cache's getLeavePolicy() instead of this constant. Left
// here only as a record of the original Phase 5 defaults, which the
// Configuration document's schema defaults mirror exactly.
export const LEAVE_QUOTAS: Record<string, number | null> = {
  [LEAVE_TYPES.SICK]: 10,
  [LEAVE_TYPES.CASUAL_PAID]: 12,
  [LEAVE_TYPES.UNPAID]: null,
};
