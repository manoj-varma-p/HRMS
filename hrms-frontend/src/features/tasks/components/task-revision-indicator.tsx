import { RotateCcw } from "lucide-react";

/** Renders nothing until a task has actually been sent back for changes at least once. */
export function TaskRevisionIndicator({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <RotateCcw className="h-3 w-3" />
      Revised {count}x
    </span>
  );
}
