// Office start/end time and grace period became admin-configurable in
// Phase 9 (see modules/configuration) — the Configuration document's
// officeSettings defaults mirror the original Phase 4 values (10:00-19:00,
// 15min grace) so behavior is unchanged until an admin edits them.
//
// HALF_DAY_THRESHOLD_HOURS stays a fixed constant: it isn't one of the
// fields Phase 9 exposes as a configurable Office Setting.
export const HALF_DAY_THRESHOLD_HOURS = 6;
