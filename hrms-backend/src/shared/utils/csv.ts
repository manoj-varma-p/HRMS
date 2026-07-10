function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv(header: string[], rows: unknown[][]): string {
  const escapedRows = rows.map((row) => row.map((cell) => escapeCsvCell(String(cell ?? ""))));
  return [header, ...escapedRows].map((row) => row.join(",")).join("\n");
}

export interface ExportResult {
  content: string;
  contentType: string;
  fileExtension: string;
}

// Every report export goes through this single map. Adding a future format
// (xlsx, pdf) means adding one more key here — callers don't change.
export const exporters: Record<string, (header: string[], rows: unknown[][]) => ExportResult> = {
  csv: (header, rows) => ({
    content: toCsv(header, rows),
    contentType: "text/csv",
    fileExtension: "csv",
  }),
};
