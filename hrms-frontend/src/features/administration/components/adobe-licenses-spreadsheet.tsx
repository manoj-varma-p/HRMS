"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Calendar,
  Check,
  Eye,
  FileSpreadsheet,
  Hash,
  Loader2,
  Plus,
  Search,
  Tags as TagsIcon,
  Trash2,
  Upload,
  UserCog,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import * as adobeLicenseService from "@/services/adobe-license.service";
import { AdobeLicenseColumn, AdobeLicenseColumnType } from "@/types/adobe-license.types";
import { AdobeLicenseAccessDialog } from "./adobe-license-access-dialog";
import { parseImportFile } from "./adobe-license-import";
import { TagsCell } from "./adobe-license-tags-cell";

const SHEET_QUERY_KEY = ["adobe-license-sheet"];
const ALL_COLUMNS = "__all__";
const SAVE_DEBOUNCE_MS = 700;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const COLUMN_TYPE_OPTIONS: { value: AdobeLicenseColumnType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "date", label: "Date" },
  { value: "number", label: "Number" },
  { value: "tags", label: "Tags" },
];

interface Draft {
  title: string;
  columns: AdobeLicenseColumn[];
  rows: string[][];
}

export function AdobeLicensesSpreadsheet() {
  const queryClient = useQueryClient();

  const {
    data: sheet,
    isLoading,
    isError,
  } = useQuery({
    queryKey: SHEET_QUERY_KEY,
    queryFn: () => adobeLicenseService.getSheet(),
    staleTime: Infinity,
  });

  // Seeded once from the fetched sheet, then edited locally so typing feels
  // instant. Never re-synced from a background refetch (staleTime: Infinity
  // means there isn't one) — only our own successful saves below update it,
  // so a slow save in flight can never clobber what's on screen. Set
  // directly during render (React's sanctioned "adjust state while
  // rendering" pattern) rather than in an effect, since it only ever needs
  // to run once and shouldn't cost an extra render pass.
  const [draft, setDraft] = useState<Draft | null>(null);
  if (sheet && !draft) {
    setDraft({ title: sheet.title, columns: sheet.columns, rows: sheet.rows });
  }

  const canEdit = sheet?.canEdit ?? false;
  const canManageAccess = sheet?.canManageAccess ?? false;

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedBadgeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateMutation = useMutation({
    mutationFn: (input: adobeLicenseService.UpdateSheetInput) =>
      adobeLicenseService.updateSheet(input),
    onSuccess: (updated) => {
      queryClient.setQueryData(SHEET_QUERY_KEY, updated);
      setSaveState("saved");
      if (savedBadgeTimeoutRef.current) clearTimeout(savedBadgeTimeoutRef.current);
      savedBadgeTimeoutRef.current = setTimeout(() => setSaveState("idle"), 2000);
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setSaveState("idle");
    },
  });

  function persist(next: Draft, immediate = false) {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    const run = () => {
      setSaveState("saving");
      updateMutation.mutate(next);
    };
    if (immediate) {
      run();
    } else {
      saveTimeoutRef.current = setTimeout(run, SAVE_DEBOUNCE_MS);
    }
  }

  function updateDraft(updater: (prev: Draft) => Draft, immediate = false) {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      persist(next, immediate);
      return next;
    });
  }

  const updateCellValue = (
    rowIndex: number,
    columnIndex: number,
    value: string,
    immediate = false
  ) =>
    updateDraft(
      (prev) => ({
        ...prev,
        rows: prev.rows.map((row, ri) =>
          ri === rowIndex ? row.map((c, ci) => (ci === columnIndex ? value : c)) : row
        ),
      }),
      immediate
    );

  const [searchQuery, setSearchQuery] = useState("");
  const [searchColumn, setSearchColumn] = useState(ALL_COLUMNS);

  // A column search filter pointing at an index that a column deletion just
  // removed would otherwise silently match nothing — reset it during render
  // rather than in an effect, same reasoning as the draft seeding above.
  if (draft && searchColumn !== ALL_COLUMNS && Number(searchColumn) >= draft.columns.length) {
    setSearchColumn(ALL_COLUMNS);
  }

  const visibleRowEntries = useMemo(() => {
    if (!draft) return [];
    const entries = draft.rows.map((row, index) => ({ row, index }));
    const q = searchQuery.trim().toLowerCase();
    if (!q) return entries;
    if (searchColumn === ALL_COLUMNS) {
      return entries.filter(({ row }) => row.some((cell) => cell.toLowerCase().includes(q)));
    }
    const colIndex = Number(searchColumn);
    return entries.filter(({ row }) => (row[colIndex] ?? "").toLowerCase().includes(q));
  }, [draft, searchQuery, searchColumn]);

  const isSearching = searchQuery.trim() !== "";
  function isCellMatch(value: string, columnIndex: number) {
    if (!isSearching) return false;
    if (searchColumn !== ALL_COLUMNS && Number(searchColumn) !== columnIndex) return false;
    return value.toLowerCase().includes(searchQuery.trim().toLowerCase());
  }

  // --- Column header: rename (double-click) vs delete (hover icon) ---
  const [editingColumnIndex, setEditingColumnIndex] = useState<number | null>(null);
  const [columnNameDraft, setColumnNameDraft] = useState("");

  function startEditingColumn(columnIndex: number) {
    if (!draft || !canEdit) return;
    setColumnNameDraft(draft.columns[columnIndex].name);
    setEditingColumnIndex(columnIndex);
  }

  function commitColumnName() {
    if (editingColumnIndex === null || !draft) return;
    const columnIndex = editingColumnIndex;
    const trimmed = columnNameDraft.trim() || draft.columns[columnIndex].name;
    updateDraft(
      (prev) => ({
        ...prev,
        columns: prev.columns.map((c, i) => (i === columnIndex ? { ...c, name: trimmed } : c)),
      }),
      true
    );
    setEditingColumnIndex(null);
  }

  function updateColumnType(columnIndex: number, type: AdobeLicenseColumnType) {
    updateDraft(
      (prev) => ({
        ...prev,
        columns: prev.columns.map((c, i) => (i === columnIndex ? { ...c, type } : c)),
      }),
      true
    );
  }

  const [pendingDeleteColumn, setPendingDeleteColumn] = useState<number | null>(null);

  function handleDeleteColumnClick(columnIndex: number) {
    if (!draft) return;
    if (draft.columns.length <= 1) {
      toast.error("A sheet needs at least one column");
      return;
    }
    setPendingDeleteColumn(columnIndex);
  }

  function confirmDeleteColumn() {
    if (pendingDeleteColumn === null) return;
    const columnIndex = pendingDeleteColumn;
    updateDraft(
      (prev) => ({
        ...prev,
        columns: prev.columns.filter((_, i) => i !== columnIndex),
        rows: prev.rows.map((row) => row.filter((_, i) => i !== columnIndex)),
      }),
      true
    );
    setPendingDeleteColumn(null);
  }

  const addColumn = () =>
    updateDraft(
      (prev) => ({
        ...prev,
        columns: [...prev.columns, { name: `Column ${prev.columns.length + 1}`, type: "text" }],
        rows: prev.rows.map((row) => [...row, ""]),
      }),
      true
    );

  const addRow = () =>
    updateDraft(
      (prev) => ({
        ...prev,
        rows: [...prev.rows, Array.from({ length: prev.columns.length }, () => "")],
      }),
      true
    );

  function deleteRow(rowIndex: number) {
    if (!draft) return;
    if (draft.rows.length <= 1) {
      toast.error("A sheet needs at least one row");
      return;
    }
    updateDraft((prev) => ({ ...prev, rows: prev.rows.filter((_, i) => i !== rowIndex) }), true);
  }

  const [accessDialogOpen, setAccessDialogOpen] = useState(false);

  // --- Import from CSV/XLSX ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsingImport, setIsParsingImport] = useState(false);
  const [pendingImport, setPendingImport] = useState<{
    columns: AdobeLicenseColumn[];
    rows: string[][];
  } | null>(null);

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsParsingImport(true);
    try {
      const table = await parseImportFile(file);
      if (table.length === 0) {
        toast.error("That file doesn't have any rows");
        return;
      }
      const [headerRow, ...bodyRows] = table;
      const columns: AdobeLicenseColumn[] = headerRow.map((name, i) => ({
        name: name.trim() || `Column ${i + 1}`,
        type: "text",
      }));
      const rows = bodyRows.map((row) => columns.map((_, i) => row[i] ?? ""));
      setPendingImport({ columns, rows });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't read that file");
    } finally {
      setIsParsingImport(false);
    }
  }

  function confirmImport() {
    if (!pendingImport) return;
    updateDraft(
      (prev) => ({ ...prev, columns: pendingImport.columns, rows: pendingImport.rows }),
      true
    );
    setPendingImport(null);
  }

  if (isError) {
    return (
      <Card className="border border-border/50">
        <CardContent className="flex h-32 items-center justify-center text-sm text-destructive">
          Couldn&apos;t load the Adobe Licenses sheet.
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !draft) {
    return (
      <Card className="border border-border/50">
        <CardContent className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          Loading sheet…
        </CardContent>
      </Card>
    );
  }

  const rowCount = draft.rows.length;
  const columnCount = draft.columns.length;
  const filledCells = draft.rows.flat().filter(Boolean).length;

  return (
    <>
      <Card className="border border-border/50 bg-card/70 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <FileSpreadsheet className="h-4 w-4 shrink-0 text-muted-foreground" />
                {canEdit ? (
                  <Input
                    value={draft.title}
                    onChange={(event) =>
                      updateDraft((prev) => ({ ...prev, title: event.target.value }))
                    }
                    onBlur={() => persist(draft, true)}
                    className="h-8 rounded-md border-transparent bg-transparent px-0 text-lg font-semibold shadow-none focus-visible:border-transparent focus-visible:ring-0"
                  />
                ) : (
                  <span>{draft.title}</span>
                )}
              </CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                Spreadsheet-style data entry for Adobe license tracking.
                {!canEdit && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                    <Eye className="h-3 w-3" />
                    View only
                  </span>
                )}
                <SaveIndicator state={saveState} />
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canManageAccess && (
                <Button variant="outline" size="sm" onClick={() => setAccessDialogOpen(true)}>
                  <UserCog className="h-4 w-4" />
                  Manage access
                </Button>
              )}
              {canEdit && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={handleFileSelected}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isParsingImport}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isParsingImport ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Import
                  </Button>
                  <Button variant="outline" size="sm" onClick={addColumn}>
                    <Plus className="h-4 w-4" />
                    Add column
                  </Button>
                  <Button variant="outline" size="sm" onClick={addRow}>
                    <Plus className="h-4 w-4" />
                    Add row
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search rows…"
                className="h-8 rounded-lg pl-8 pr-8 text-sm"
              />
              {isSearching && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <Select value={searchColumn} onValueChange={(v) => v && setSearchColumn(v)}>
              <SelectTrigger className="h-8 w-full sm:w-44" aria-label="Search within column">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_COLUMNS}>All columns</SelectItem>
                {draft.columns.map((column, index) => (
                  <SelectItem key={`search-col-${index}`} value={String(index)}>
                    {column.name || `Column ${index + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {isSearching
                ? `${visibleRowEntries.length} of ${rowCount} row(s) match`
                : `${filledCells} filled cell${filledCells === 1 ? "" : "s"}`}
            </p>
            <p className="text-xs text-muted-foreground">
              {rowCount} row(s) &bull; {columnCount} column(s)
            </p>
          </div>

          <div className="max-h-[70vh] overflow-auto rounded-xl border border-border/50">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 top-0 z-20 min-w-14 border-r border-b border-border/50 bg-muted/80 px-3 py-3 text-left text-[11px] font-semibold tracking-wide text-muted-foreground uppercase backdrop-blur-sm">
                    #
                  </th>
                  {draft.columns.map((column, columnIndex) => (
                    <th
                      key={`header-${columnIndex}`}
                      className="group sticky top-0 z-10 min-w-40 border-r border-b border-border/50 bg-muted/80 px-3 py-2.5 text-left align-top backdrop-blur-sm last:border-r-0"
                    >
                      {editingColumnIndex === columnIndex ? (
                        <div className="flex flex-col gap-1.5">
                          <Input
                            autoFocus
                            value={columnNameDraft}
                            onChange={(event) => setColumnNameDraft(event.target.value)}
                            onFocus={(event) => event.currentTarget.select()}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") event.currentTarget.blur();
                              if (event.key === "Escape") setEditingColumnIndex(null);
                            }}
                            onBlur={commitColumnName}
                            className="h-7 rounded-md bg-background px-2 text-[13px] font-semibold"
                          />
                          <Select
                            value={column.type}
                            onValueChange={(v) =>
                              v && updateColumnType(columnIndex, v as AdobeLicenseColumnType)
                            }
                          >
                            <SelectTrigger size="sm" className="h-6 w-full text-[11px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {COLUMN_TYPE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div
                          className="flex items-center justify-between gap-1"
                          onDoubleClick={() => startEditingColumn(columnIndex)}
                          title={canEdit ? "Double-click to rename" : undefined}
                        >
                          <span className="flex min-w-0 items-center gap-1.5 truncate text-[13px] font-semibold tracking-wide text-foreground">
                            <ColumnTypeIcon type={column.type} />
                            <span className="truncate">{column.name || `Column ${columnIndex + 1}`}</span>
                          </span>
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                              onClick={() => handleDeleteColumnClick(columnIndex)}
                              aria-label={`Delete column ${column.name}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {visibleRowEntries.map(({ row, index: rowIndex }) => (
                  <tr key={`row-${rowIndex}`} className="group even:bg-muted/20 hover:bg-muted/40">
                    <td className="sticky left-0 z-10 border-r border-b border-border/40 bg-background px-3 py-2 align-top">
                      <div className="flex items-center gap-1.5">
                        <span className="min-w-5 text-xs text-muted-foreground">{rowIndex + 1}</span>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                            onClick={() => deleteRow(rowIndex)}
                            aria-label={`Delete row ${rowIndex + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>

                    {row.map((cell, columnIndex) => (
                      <td
                        key={`cell-${rowIndex}-${columnIndex}`}
                        className="border-r border-b border-border/40 px-1.5 py-1.5 last:border-r-0"
                      >
                        <SheetCell
                          type={draft.columns[columnIndex]?.type ?? "text"}
                          value={cell}
                          readOnly={!canEdit}
                          highlighted={isCellMatch(cell, columnIndex)}
                          onChange={(value, immediate) =>
                            updateCellValue(rowIndex, columnIndex, value, immediate)
                          }
                          onBlurFlush={() => persist(draft, true)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}

                {visibleRowEntries.length === 0 && (
                  <tr>
                    <td
                      colSpan={columnCount + 1}
                      className="px-3 py-10 text-center text-sm text-muted-foreground"
                    >
                      {isSearching ? "No rows match your search." : "No rows yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={pendingDeleteColumn !== null}
        onOpenChange={(open) => !open && setPendingDeleteColumn(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete column?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteColumn !== null &&
                `"${draft.columns[pendingDeleteColumn]?.name || `Column ${pendingDeleteColumn + 1}`}" and all its data will be removed. This can't be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDeleteColumn}>
              Delete column
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={pendingImport !== null} onOpenChange={(open) => !open && setPendingImport(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace sheet with imported data?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingImport &&
                `This will replace the current ${columnCount} column(s) and ${rowCount} row(s) with ${pendingImport.columns.length} column(s) and ${pendingImport.rows.length} row(s) from the file. This can't be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmImport}>
              Replace data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {canManageAccess && (
        <AdobeLicenseAccessDialog open={accessDialogOpen} onOpenChange={setAccessDialogOpen} />
      )}
    </>
  );
}

function ColumnTypeIcon({ type }: { type: AdobeLicenseColumnType }) {
  if (type === "date") return <Calendar className="h-3 w-3 shrink-0 text-muted-foreground" />;
  if (type === "tags") return <TagsIcon className="h-3 w-3 shrink-0 text-muted-foreground" />;
  if (type === "number") return <Hash className="h-3 w-3 shrink-0 text-muted-foreground" />;
  return null;
}

function SheetCell({
  type,
  value,
  readOnly,
  highlighted,
  onChange,
  onBlurFlush,
}: {
  type: AdobeLicenseColumnType;
  value: string;
  readOnly: boolean;
  highlighted: boolean;
  onChange: (value: string, immediate?: boolean) => void;
  onBlurFlush: () => void;
}) {
  if (type === "date") {
    return (
      <input
        type="date"
        value={DATE_PATTERN.test(value) ? value : ""}
        onChange={(event) => onChange(event.target.value, true)}
        disabled={readOnly}
        className={`h-8 w-full rounded-md border border-transparent bg-transparent px-2 text-sm text-foreground shadow-none outline-none scheme-light focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-70 dark:scheme-dark ${
          highlighted ? "bg-primary/10 ring-1 ring-primary/30" : ""
        }`}
      />
    );
  }

  if (type === "tags") {
    return (
      <TagsCell
        value={value}
        onChange={(next) => onChange(next, true)}
        readOnly={readOnly}
      />
    );
  }

  if (type === "number") {
    return (
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlurFlush}
        readOnly={readOnly}
        className={`h-8 w-full rounded-md border border-transparent bg-transparent px-2 text-sm text-foreground shadow-none outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ${
          readOnly ? "text-muted-foreground" : ""
        } ${highlighted ? "bg-primary/10 ring-1 ring-primary/30" : ""}`}
        placeholder={readOnly ? "" : "0"}
      />
    );
  }

  return (
    <Input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlurFlush}
      readOnly={readOnly}
      className={`h-8 rounded-md border-transparent bg-transparent px-2 shadow-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ${
        readOnly ? "text-muted-foreground" : ""
      } ${highlighted ? "bg-primary/10 ring-1 ring-primary/30" : ""}`}
      placeholder={readOnly ? "" : "Enter value"}
    />
  );
}

function SaveIndicator({ state }: { state: "idle" | "saving" | "saved" }) {
  if (state === "saving") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving…
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Check className="h-3 w-3" />
        Saved
      </span>
    );
  }
  return null;
}
