"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getHealth } from "@/services/health.service";

export function BackendStatusCard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
    retry: 1,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backend Connectivity</CardTitle>
        <CardDescription>
          Live status of the hrms-backend REST API
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-3">
        {isLoading && (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Checking...</span>
          </>
        )}
        {isError && (
          <>
            <XCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">
              Unable to reach backend API
            </span>
          </>
        )}
        {data && (
          <>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-sm">{data.message}</span>
            <Badge variant="secondary" className="ml-auto">
              {new Date(data.data.timestamp).toLocaleTimeString()}
            </Badge>
          </>
        )}
      </CardContent>
    </Card>
  );
}
