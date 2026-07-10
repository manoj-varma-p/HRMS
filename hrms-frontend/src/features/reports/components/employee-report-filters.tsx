import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLES } from "@/constants/roles";
import { EMPLOYEE_STATUS } from "@/constants/employee-status";
import { ReportSearchInput } from "./filters/report-search-input";
import { DateRangeFilter, DateRangeValue } from "./filters/date-range-filter";
import { DepartmentFilter } from "./filters/department-filter";
import { DesignationFilter } from "./filters/designation-filter";

const ALL = "ALL";

function toFilterValue(v: string | null): string | undefined {
  return v && v !== ALL ? v : undefined;
}

const ROLE_LABELS: Record<string, string> = {
  EMPLOYEE: "Employee",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  NOTICE_PERIOD: "Notice Period",
  RESIGNED: "Resigned",
  TERMINATED: "Terminated",
};

export interface EmployeeReportFilterValues extends DateRangeValue {
  search: string;
  department?: string;
  designation?: string;
  role?: string;
  status?: string;
}

export function EmployeeReportFilters({
  value,
  onChange,
}: {
  value: EmployeeReportFilterValues;
  onChange: (value: EmployeeReportFilterValues) => void;
}) {
  return (
    <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:flex-wrap sm:items-center">
      <ReportSearchInput
        value={value.search}
        onChange={(search) => onChange({ ...value, search })}
        placeholder="Search by ID, name, email, phone"
      />
      <DateRangeFilter value={value} onChange={(range) => onChange({ ...value, ...range })} />
      <DepartmentFilter value={value.department} onChange={(department) => onChange({ ...value, department })} />
      <DesignationFilter value={value.designation} onChange={(designation) => onChange({ ...value, designation })} />
      <Select value={value.role ?? ALL} onValueChange={(v) => onChange({ ...value, role: toFilterValue(v) })}>
        <SelectTrigger className="w-full sm:w-36" aria-label="Filter by role">
          <SelectValue placeholder="Role">{(v: string) => (v === ALL ? "All Roles" : ROLE_LABELS[v])}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All Roles</SelectItem>
          {Object.values(ROLES).map((r) => (
            <SelectItem key={r} value={r}>
              {ROLE_LABELS[r]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={value.status ?? ALL}
        onValueChange={(v) => onChange({ ...value, status: toFilterValue(v) })}
      >
        <SelectTrigger className="w-full sm:w-40" aria-label="Filter by status">
          <SelectValue placeholder="Status">
            {(v: string) => (v === ALL ? "All Statuses" : STATUS_LABELS[v])}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All Statuses</SelectItem>
          {Object.values(EMPLOYEE_STATUS).map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
