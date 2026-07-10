import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Employee } from "@/types/employee.types";
import { EmployeeStatusBadge } from "./employee-status-badge";

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

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

export function EmployeeProfileView({
  employee,
  attendanceHref,
}: {
  employee: Employee;
  attendanceHref?: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col items-start gap-4 pt-6 sm:flex-row sm:items-center">
          <Avatar className="h-16 w-16">
            <AvatarImage src={employee.profilePhoto ?? undefined} />
            <AvatarFallback className="text-lg">
              {getInitials(employee.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{employee.fullName}</h2>
              <EmployeeStatusBadge status={employee.status} />
              <Badge variant="secondary">{ROLE_LABELS[employee.role]}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {employee.employeeId} · {employee.email}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" value={employee.email} />
          <Field label="Phone" value={employee.phone} />
          <Field label="Department" value={employee.department?.name} />
          <Field label="Designation" value={employee.designation?.name} />
          <Field
            label="Joining Date"
            value={new Date(employee.joiningDate).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          />
          <Field label="Role" value={ROLE_LABELS[employee.role]} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Address" value={employee.address} />
          <Field
            label="Emergency Contact"
            value={
              employee.emergencyContact
                ? `${employee.emergencyContact.name} · ${employee.emergencyContact.phone}`
                : undefined
            }
          />
        </CardContent>
      </Card>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceHref ? (
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href={attendanceHref} />}
              >
                View Attendance
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">Coming in a future phase</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Leave</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Coming in a future phase
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Activity</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Coming in a future phase
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
