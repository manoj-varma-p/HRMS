import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportButton({
  onClick,
  loading,
}: {
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <Button variant="outline" onClick={onClick} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      Export CSV
    </Button>
  );
}
