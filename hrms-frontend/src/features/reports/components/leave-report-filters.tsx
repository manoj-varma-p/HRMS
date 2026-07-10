import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LEAVE_REQUEST_STATUS } from "@/constants/leave-types";
import { ReportSearchInput } from "./filters/report-search-input";
import { DateRangeFilter, DateRangeValue } from "./filters/date-range-filter";
import { DepartmentFilter } from "./filters/department-filter";
import { DesignationFilter } from "./filters/designation-filter";
import { EmployeeFilter } from "./filters/employee-filter";
import { LeaveTypeFilter } from "./filters/leave-type-filter";

const ALL = "ALL";

function toFilterValue(v: string | null): string | undefined {
  return v && v !== ALL ? v : undefined;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export interface LeaveReportFilterValues extends DateRangeValue {
  search: string;
  department?: string;
  designation?: string;
  employeeId?: string;
  leaveType?: string;
  status?: string;
}

export function LeaveReportFilters({
  value,
  onChange,
}: {
  value: LeaveReportFilterValues;
  onChange: (value: LeaveReportFilterValues) => void;
}) {
  return (
    <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:flex-wrap sm:items-center">
      <ReportSearchInput value={value.search} onChange={(search) => onChange({ ...value, search })} />
      <DateRangeFilter value={value} onChange={(range) => onChange({ ...value, ...range })} />
      <DepartmentFilter value={value.department} onChange={(department) => onChange({ ...value, department })} />
      <DesignationFilter value={value.designation} onChange={(designation) => onChange({ ...value, designation })} />
      <EmployeeFilter value={value.employeeId} onChange={(employeeId) => onChange({ ...value, employeeId })} />
      <LeaveTypeFilter value={value.leaveType} onChange={(leaveType) => onChange({ ...value, leaveType })} />
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
          {Object.values(LEAVE_REQUEST_STATUS).map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
