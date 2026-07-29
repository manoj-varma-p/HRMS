"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { User, CalendarCheck } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as attendanceService from "@/services/attendance.service";
import * as employeeService from "@/services/employee.service";
import { AttendanceStatusBadge } from "@/features/attendance/components/attendance-status-badge";
import { EmployeeStatusBadge } from "@/features/employees/components/employee-status-badge";
import { formatISTDate, formatISTTime, formatWorkedHours } from "@/lib/format-ist";
import { ExportButton } from "./export-button";

const COLUMN_COUNT = 5;

export interface DailyDetailEmployee {
  id: string;
  employeeId: string;
  fullName: string;
  email?: string;
  phone?: string;
  joiningDate?: string;
  role?: string;
  status?: string;
  salary?: number | null;
  employmentType?: string;
  department?: string | null;
  designation?: string | null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatSalary(amount?: number | null): string {
  if (amount === undefined || amount === null) return "—";
  return `₹${amount.toLocaleString("en-IN")}`;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

export function EmployeeDailyDetailDialog({
  employee,
  year,
  month,
  onClose,
}: {
  employee: DailyDetailEmployee | null;
  year: number;
  month: number;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"profile" | "attendance">("profile");

  useEffect(() => {
    if (employee) {
      setActiveTab("profile");
    }
  }, [employee]);

  const { data: fullEmployeeData, isLoading: isLoadingEmployee } = useQuery({
    queryKey: ["employee-detail", employee?.id],
    queryFn: () => employeeService.getEmployee(employee!.id).then((res) => res.data.employee),
    enabled: Boolean(employee?.id),
  });

  const {
    data: attendanceData,
    isLoading: isLoadingAttendance,
    isError: isAttendanceError,
  } = useQuery({
    queryKey: ["employee-daily-detail", employee?.id, year, month],
    queryFn: () =>
      attendanceService.getHistory({ employeeId: employee!.id, year, month }).then((res) => res.data),
    enabled: Boolean(employee?.id),
  });

  const exportMutation = useMutation({
    mutationFn: () =>
      attendanceService.exportHistoryCsv(
        { employeeId: employee!.id, year, month },
        `attendance-${employee!.employeeId}-${year}-${String(month).padStart(2, "0")}.csv`
      ),
    onSuccess: () => toast.success("Attendance history exported"),
    onError: (err: Error) => toast.error(err.message),
  });

  const emp = fullEmployeeData
    ? {
        id: fullEmployeeData.id,
        employeeId: fullEmployeeData.employeeId,
        fullName: fullEmployeeData.fullName,
        email: fullEmployeeData.email,
        phone: fullEmployeeData.phone,
        joiningDate: fullEmployeeData.joiningDate,
        role: fullEmployeeData.role,
        status: fullEmployeeData.status,
        salary: fullEmployeeData.salary,
        employmentType: fullEmployeeData.employmentType,
        department: fullEmployeeData.department?.name ?? employee?.department ?? null,
        designation: fullEmployeeData.designation?.name ?? employee?.designation ?? null,
      }
    : employee;

  const formattedMonthName = new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <Sheet open={employee !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="flex flex-col overflow-y-auto data-[side=right]:w-[85%] data-[side=right]:sm:max-w-[650px] p-6 gap-6"
      >
        {emp && (
          <>
            <SheetHeader className="p-0 gap-3 border-b pb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-base font-semibold">
                    {getInitials(emp.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <SheetTitle className="text-lg font-semibold">{emp.fullName}</SheetTitle>
                    {emp.status && <EmployeeStatusBadge status={emp.status as any} />}
                  </div>
                  <SheetDescription className="text-xs text-muted-foreground">
                    {emp.employeeId} · {emp.email ?? "No email"}
                  </SheetDescription>
                </div>
              </div>

              {/* Two Option Header Switcher */}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant={activeTab === "profile" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("profile")}
                  className="gap-2"
                >
                  <User className="h-4 w-4" />
                  Employee Profile
                </Button>
                <Button
                  variant={activeTab === "attendance" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("attendance")}
                  className="gap-2"
                >
                  <CalendarCheck className="h-4 w-4" />
                  Attendance Summary
                </Button>
              </div>
            </SheetHeader>

            {activeTab === "profile" ? (
              <div className="flex flex-col gap-6">
                {isLoadingEmployee ? (
                  <div className="space-y-4">
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                  </div>
                ) : (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base font-semibold">Basic Information</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4 sm:grid-cols-2">
                        <Field label="Full Name" value={emp.fullName} />
                        <Field label="Employee ID" value={emp.employeeId} />
                        <Field label="Email" value={emp.email} />
                        <Field label="Phone" value={emp.phone} />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base font-semibold">Employment Details</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4 sm:grid-cols-2">
                        <Field label="Department" value={emp.department} />
                        <Field label="Designation" value={emp.designation} />
                        <Field
                          label="Joining Date"
                          value={emp.joiningDate ? formatISTDate(emp.joiningDate) : "—"}
                        />
                        <Field label="Salary" value={formatSalary(emp.salary)} />
                        <Field
                          label="Employment Type"
                          value={
                            emp.employmentType === "PERMANENT" ? "Permanent" : "Probation"
                          }
                        />
                        <Field label="Role" value={emp.role ?? "EMPLOYEE"} />
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-semibold">Daily Attendance Logs</h4>
                    <p className="text-xs text-muted-foreground">{formattedMonthName}</p>
                  </div>
                  <ExportButton
                    onClick={() => exportMutation.mutate()}
                    loading={exportMutation.isPending}
                  />
                </div>

                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Check In</TableHead>
                        <TableHead>Check Out</TableHead>
                        <TableHead>Worked Hours</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingAttendance &&
                        Array.from({ length: 6 }).map((_, i) => (
                          <TableRow key={`skeleton-${i}`}>
                            {Array.from({ length: COLUMN_COUNT }).map((_, c) => (
                              <TableCell key={c}>
                                <Skeleton className="h-5 w-full max-w-24" />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}

                      {!isLoadingAttendance && isAttendanceError && (
                        <TableRow>
                          <TableCell colSpan={COLUMN_COUNT} className="h-24 text-center">
                            <p className="text-sm text-destructive">Couldn&apos;t load daily attendance.</p>
                          </TableCell>
                        </TableRow>
                      )}

                      {!isLoadingAttendance &&
                        !isAttendanceError &&
                        attendanceData?.days.map((day) => (
                          <TableRow key={day.date}>
                            <TableCell>{formatISTDate(day.date)}</TableCell>
                            <TableCell>{formatISTTime(day.checkIn)}</TableCell>
                            <TableCell>{formatISTTime(day.checkOut)}</TableCell>
                            <TableCell>{formatWorkedHours(day.workedHours)}</TableCell>
                            <TableCell>
                              <AttendanceStatusBadge status={day.status} />
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
