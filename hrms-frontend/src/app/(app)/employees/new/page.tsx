"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleGuard } from "@/components/layout/role-guard";
import { ROLES } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import { CreateEmployeeForm } from "@/features/employees/components/create-employee-form";
import { TempPasswordDialog } from "@/features/employees/components/temp-password-dialog";

export default function NewEmployeePage() {
  return (
    <RoleGuard allow={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
      <NewEmployeePageContent />
    </RoleGuard>
  );
}

function NewEmployeePageContent() {
  const router = useRouter();
  const [result, setResult] = useState<{
    employeeName: string;
    employeeId: string;
    tempPassword: string;
  } | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 -ml-2"
          onClick={() => router.push(ROUTES.EMPLOYEES)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Employees
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Add Employee</h1>
        <p className="text-sm text-muted-foreground">
          Employee ID and a temporary password are generated automatically.
        </p>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base">Employee details</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateEmployeeForm onCreated={setResult} />
        </CardContent>
      </Card>

      {result && (
        <TempPasswordDialog
          open
          employeeName={result.employeeName}
          employeeId={result.employeeId}
          tempPassword={result.tempPassword}
          onClose={() => {
            setResult(null);
            router.push(ROUTES.EMPLOYEES);
          }}
        />
      )}
    </div>
  );
}
