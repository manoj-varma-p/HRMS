import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface QuickAction {
  label: string;
  href: string;
  icon: LucideIcon;
}

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="h-auto flex-col gap-2 py-4"
            nativeButton={false}
            render={<Link href={action.href} />}
          >
            <action.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{action.label}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
