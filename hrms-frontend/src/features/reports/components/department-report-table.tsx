"use client";

import { Building2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DepartmentReportRow } from "@/types/report.types";
import { EmptyReportState } from "./empty-report-state";

const COLUMN_COUNT = 8;

export function DepartmentReportTable({
  rows,
  isLoading,
  isError,
}: {
  rows: DepartmentReportRow[];
  isLoading: boolean;
  isError: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Department</TableHead>
            <TableHead>Total Employees</TableHead>
            <TableHead>Active Employees</TableHead>
            <TableHead>Notice Period</TableHead>
            <TableHead>Resigned</TableHead>
            <TableHead>Terminated</TableHead>
            <TableHead>Attendance %</TableHead>
            <TableHead>Total Leave Days</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={`skeleton-${i}`}>
                {Array.from({ length: COLUMN_COUNT }).map((_, c) => (
                  <TableCell key={c}>
                    <Skeleton className="h-5 w-full max-w-28" />
                  </TableCell>
                ))}
              </TableRow>
            ))}

          {!isLoading && isError && (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT} className="h-32 text-center">
                <p className="text-sm text-destructive">Couldn&apos;t load the department report.</p>
              </TableCell>
            </TableRow>
          )}

          {!isLoading && !isError && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT} className="h-40 text-center">
                <EmptyReportState icon={Building2} title="No departments found" hint="Add a department to get started." />
              </TableCell>
            </TableRow>
          )}

          {!isLoading &&
            !isError &&
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>{row.totalEmployees}</TableCell>
                <TableCell>{row.activeEmployees}</TableCell>
                <TableCell>{row.noticePeriod}</TableCell>
                <TableCell>{row.resigned}</TableCell>
                <TableCell>{row.terminated}</TableCell>
                <TableCell>{row.attendancePercentage}%</TableCell>
                <TableCell>{row.totalLeaveDays}</TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}
