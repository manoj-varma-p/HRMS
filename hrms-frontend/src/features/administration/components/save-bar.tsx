import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SaveBar({
  visible,
  isSaving,
  onSave,
  onDiscard,
}: {
  visible: boolean;
  isSaving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}) {
  if (!visible) return null;

  return (
    <div className="sticky bottom-4 z-40 flex items-center justify-between gap-3 rounded-xl border bg-popover px-4 py-3 text-popover-foreground shadow-lg">
      <span className="text-sm font-medium">You have unsaved changes</span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={isSaving} onClick={onDiscard}>
          Discard
        </Button>
        <Button size="sm" disabled={isSaving} onClick={onSave}>
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
