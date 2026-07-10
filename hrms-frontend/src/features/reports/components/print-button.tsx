"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as reportService from "@/services/report.service";

export function PrintButton({ reportType }: { reportType: string }) {
  function handlePrint() {
    // Best-effort — the printed page itself must never be blocked by this
    // logging call, so failures are swallowed rather than surfaced.
    reportService.logReportPrint(reportType).catch(() => {});
    window.print();
  }

  return (
    <Button variant="outline" onClick={handlePrint}>
      <Printer className="h-4 w-4" />
      Print
    </Button>
  );
}
