// Hex equivalents of the Tailwind classes already used for status badges
// throughout the app (attendance-status-meta.ts, leave-status-meta.ts,
// employee-status-badge.tsx) — charts reuse the same color-to-meaning
// mapping instead of inventing a second one.
export const STATUS_CHART_COLORS = {
  onTime: "#10b981", // emerald-500
  late: "#eab308", // yellow-500
  halfDay: "#f97316", // orange-500
  absent: "#ef4444", // red-500
  onLeave: "#3b82f6", // blue-500
  holiday: "#a855f7", // purple-500
  weekend: "#9ca3af", // gray-400
  missedCheckout: "#e11d48", // rose-600
  pending: "#f59e0b", // amber-500
  approved: "#10b981",
  rejected: "#ef4444",
  cancelled: "#9ca3af",
  active: "#10b981",
  inactive: "#9ca3af",
  noticePeriod: "#f59e0b",
  resigned: "#f97316",
  terminated: "#ef4444",
} as const;

// Validated categorical palette (dataviz skill reference instance) — used
// for pure-identity charts with no pre-existing status meaning
// (department/designation/leave-type distribution). Fixed order, never
// cycled or reassigned per-render.
export const CATEGORICAL_CHART_COLORS = [
  "#2a78d6", // blue
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
  "#e87ba4", // magenta
  "#eb6834", // orange
];

export const CHART_GRID_COLOR = "#e1e0d9";
export const CHART_AXIS_COLOR = "#898781";
