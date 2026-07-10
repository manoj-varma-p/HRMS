import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReportSearchInput } from "./filters/report-search-input";
import { DepartmentFilter } from "./filters/department-filter";
import { DesignationFilter } from "./filters/designation-filter";

export interface MonthlySummaryFilterValues {
  search: string;
  department?: string;
  designation?: string;
  year: number;
  month: number;
}

export function MonthlySummaryFilters({
  value,
  onChange,
}: {
  value: MonthlySummaryFilterValues;
  onChange: (value: MonthlySummaryFilterValues) => void;
}) {
  return (
    <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:flex-wrap sm:items-center">
      <ReportSearchInput value={value.search} onChange={(search) => onChange({ ...value, search })} />
      <Select value={String(value.month)} onValueChange={(v) => onChange({ ...value, month: Number(v) })}>
        <SelectTrigger className="w-full sm:w-36" aria-label="Month">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 12 }).map((_, i) => (
            <SelectItem key={i + 1} value={String(i + 1)}>
              {new Date(2000, i, 1).toLocaleDateString("en-US", { month: "long" })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="number"
        className="w-full sm:w-24"
        value={value.year}
        onChange={(e) => onChange({ ...value, year: Number(e.target.value) })}
      />
      <DepartmentFilter value={value.department} onChange={(department) => onChange({ ...value, department })} />
      <DesignationFilter value={value.designation} onChange={(designation) => onChange({ ...value, designation })} />
    </div>
  );
}
