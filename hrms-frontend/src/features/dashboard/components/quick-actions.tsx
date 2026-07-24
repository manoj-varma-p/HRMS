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
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="group h-auto flex-col gap-2 py-4 border border-border/40 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white hover:text-black dark:hover:bg-white dark:hover:text-black hover:border-transparent hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(0,0,0,0.2)]"
            nativeButton={false}
            render={<Link href={action.href} />}
          >
            <action.icon className="h-5 w-5 text-muted-foreground transition-colors duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:text-black/80" />
            <span className="text-xs font-medium transition-colors duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:text-black">{action.label}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
