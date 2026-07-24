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
    <div className="sticky bottom-4 z-40 flex flex-col gap-3 rounded-xl border border-border/60 bg-card/95 px-4 py-3 text-card-foreground shadow-[0_12px_30px_rgba(0,0,0,0.12)] backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm font-medium text-foreground">You have unsaved changes</span>
      <div className="flex flex-col-reverse gap-2 sm:flex-row">
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
