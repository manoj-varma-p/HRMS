import { ReportSearchInput } from "./filters/report-search-input";
import { DateRangeFilter, DateRangeValue } from "./filters/date-range-filter";
import { MonthYearFilter } from "./filters/month-year-filter";
import { DepartmentFilter } from "./filters/department-filter";
import { DesignationFilter } from "./filters/designation-filter";
import { EmployeeFilter } from "./filters/employee-filter";
import { AttendanceStatusFilter } from "./filters/attendance-status-filter";

export interface AttendanceReportFilterValues extends DateRangeValue {
  search: string;
  department?: string;
  designation?: string;
  employeeId?: string;
  status?: string;
}

export function AttendanceReportFilters({
  value,
  onChange,
}: {
  value: AttendanceReportFilterValues;
  onChange: (value: AttendanceReportFilterValues) => void;
}) {
  return (
    <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:flex-wrap sm:items-center">
      <ReportSearchInput value={value.search} onChange={(search) => onChange({ ...value, search })} />
      <MonthYearFilter onApply={(range) => onChange({ ...value, ...range })} />
      <DateRangeFilter value={value} onChange={(range) => onChange({ ...value, ...range })} />
      <DepartmentFilter value={value.department} onChange={(department) => onChange({ ...value, department })} />
      <DesignationFilter value={value.designation} onChange={(designation) => onChange({ ...value, designation })} />
      <EmployeeFilter value={value.employeeId} onChange={(employeeId) => onChange({ ...value, employeeId })} />
      <AttendanceStatusFilter value={value.status} onChange={(status) => onChange({ ...value, status })} />
    </div>
  );
}
