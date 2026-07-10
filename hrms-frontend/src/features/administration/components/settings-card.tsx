import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function SettingsCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition-colors hover:bg-accent/50">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </CardHeader>
      </Card>
    </Link>
  );
}
