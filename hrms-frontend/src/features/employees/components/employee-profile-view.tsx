"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  User,
  CalendarCheck,
  Briefcase,
  MapPin,
  Camera,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Employee } from "@/types/employee.types";
import { EmployeeStatusBadge } from "./employee-status-badge";
import { AttendanceStatusBadge } from "@/features/attendance/components/attendance-status-badge";
import * as attendanceService from "@/services/attendance.service";
import * as employeeService from "@/services/employee.service";
import { useAuth } from "@/hooks/use-auth";
import { formatISTDate, formatISTTime, formatWorkedHours } from "@/lib/format-ist";
import { ExportButton } from "@/features/reports/components/export-button";

const ROLE_LABELS: Record<string, string> = {
  EMPLOYEE: "Employee",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatSalary(amount?: number | null): string {
  if (amount === undefined || amount === null) return "Not Specified";
  return `₹${amount.toLocaleString("en-IN")}`;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

export function EmployeeProfileView({
  employee,
}: {
  employee: Employee;
  attendanceHref?: string;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"overview" | "attendance">("overview");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setUploadingPhoto(true);
      try {
        if (user?.id === employee.id) {
          await employeeService.updateMyProfile({ profilePhoto: dataUrl });
        } else {
          await employeeService.updateEmployee(employee.id, { profilePhoto: dataUrl });
        }
        toast.success("Profile photo updated successfully");
        queryClient.invalidateQueries({ queryKey: ["my-profile"] });
        queryClient.invalidateQueries({ queryKey: ["employee", employee.id] });
        queryClient.invalidateQueries({ queryKey: ["employees"] });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update profile photo");
      } finally {
        setUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const {
    data: attendanceData,
    isLoading: isLoadingAttendance,
    isError: isAttendanceError,
  } = useQuery({
    queryKey: ["employee-daily-detail", employee.id, selectedYear, selectedMonth],
    queryFn: () =>
      attendanceService
        .getHistory({ employeeId: employee.id, year: selectedYear, month: selectedMonth })
        .then((res) => res.data),
    enabled: activeTab === "attendance",
  });

  const exportMutation = useMutation({
    mutationFn: () =>
      attendanceService.exportHistoryCsv(
        { employeeId: employee.id, year: selectedYear, month: selectedMonth },
        `attendance-${employee.employeeId}-${selectedYear}-${String(selectedMonth).padStart(2, "0")}.csv`
      ),
    onSuccess: () => toast.success("Attendance history exported"),
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header Profile Hero Card */}
      <Card className="border shadow-sm">
        <CardContent className="flex flex-col gap-6 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-20 w-20 border-2 border-primary/20">
                <AvatarImage src={employee.profilePhoto ?? undefined} />
                <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                  {getInitials(employee.fullName)}
                </AvatarFallback>
              </Avatar>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={handlePhotoSelect}
              />

              <button
                type="button"
                disabled={uploadingPhoto}
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
                title="Upload Profile Photo"
              >
                {uploadingPhoto ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Camera className="h-5 w-5" />
                )}
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight">{employee.fullName}</h2>
                <EmployeeStatusBadge status={employee.status} />
                <Badge variant="secondary">{ROLE_LABELS[employee.role] ?? employee.role}</Badge>
                <Badge variant={employee.employmentType === "PERMANENT" ? "default" : "outline"}>
                  {employee.employmentType === "PERMANENT" ? "Permanent" : "Probation"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{employee.employeeId}</span> · {employee.email} · {employee.phone}
              </p>
            </div>
          </div>

          {/* Navigation Tabs Header Switcher */}
          <div className="flex items-center gap-2 border bg-muted/40 p-1.5 rounded-lg w-fit">
            <Button
              variant={activeTab === "overview" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("overview")}
              className="gap-2 text-xs font-medium"
            >
              <User className="h-3.5 w-3.5" />
              Profile Overview
            </Button>
            <Button
              variant={activeTab === "attendance" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("attendance")}
              className="gap-2 text-xs font-medium"
            >
              <CalendarCheck className="h-3.5 w-3.5" />
              Attendance & History
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tab Contents */}
      {activeTab === "overview" && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic & Contact Information */}
          <Card>
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Basic & Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 pt-4">
              <Field label="Full Name" value={employee.fullName} />
              <Field label="Employee ID" value={employee.employeeId} />
              <Field label="Email Address" value={employee.email} />
              <Field label="Phone Number" value={employee.phone} />
              <Field label="Blood Group" value={employee.bloodGroup} />
              <Field
                label="Date of Birth"
                value={employee.dateOfBirth ? formatISTDate(employee.dateOfBirth) : "—"}
              />
              <Field label="System Role" value={ROLE_LABELS[employee.role] ?? employee.role} />
            </CardContent>
          </Card>

          {/* Work & Compensation */}
          <Card>
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Work & Compensation
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 pt-4">
              <Field label="Department" value={employee.department?.name} />
              <Field label="Designation" value={employee.designation?.name} />
              <Field
                label="Joining Date"
                value={employee.joiningDate ? formatISTDate(employee.joiningDate) : "—"}
              />
              <Field label="Salary" value={formatSalary(employee.salary)} />
              <Field
                label="Employment Type"
                value={
                  employee.employmentType === "PERMANENT"
                    ? `Permanent (Since ${
                        employee.permanentSince ? formatISTDate(employee.permanentSince) : "—"
                      })`
                    : "Probation"
                }
              />
              <Field label="Grace Override" value={employee.gracePeriodOverrideMinutes ? `${employee.gracePeriodOverrideMinutes} mins` : "Company Default"} />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "attendance" && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-primary" />
                Monthly Attendance History
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Detailed check-in, check-out, worked hours, and status breakdown.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Month Selector */}
              <Select
                value={String(selectedMonth)}
                onValueChange={(v) => setSelectedMonth(Number(v))}
              >
                <SelectTrigger className="w-36 h-9 text-xs">
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {new Date(2000, m - 1, 1).toLocaleDateString("en-US", { month: "long" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Year Selector */}
              <Select
                value={String(selectedYear)}
                onValueChange={(v) => setSelectedYear(Number(v))}
              >
                <SelectTrigger className="w-28 h-9 text-xs">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {[now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2].map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <ExportButton
                onClick={() => exportMutation.mutate()}
                loading={exportMutation.isPending}
              />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
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
                        <TableCell colSpan={5}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      </TableRow>
                    ))}

                  {!isLoadingAttendance && isAttendanceError && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <p className="text-sm text-destructive">Couldn&apos;t load daily attendance.</p>
                      </TableCell>
                    </TableRow>
                  )}

                  {!isLoadingAttendance &&
                    !isAttendanceError &&
                    attendanceData?.days.map((day) => (
                      <TableRow key={day.date}>
                        <TableCell className="font-medium">{formatISTDate(day.date)}</TableCell>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
