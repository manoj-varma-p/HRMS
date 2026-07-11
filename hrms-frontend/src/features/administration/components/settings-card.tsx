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
    <Link href={href} className="group block">
      <Card className="h-full border border-border/40 transition-all duration-400 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:bg-white group-hover:text-black group-hover:border-transparent group-hover:-translate-y-0.5 group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.2)]">
        <div className="flex items-center justify-between p-5 h-full">
          <div className="flex items-start gap-4">
            <Icon className="h-5 w-5 mt-1 shrink-0 text-muted-foreground transition-colors duration-400 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:text-black/80" />
            <div className="flex flex-col gap-1">
              <CardTitle className="text-base font-semibold leading-none transition-colors duration-400 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:text-black">{title}</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1 transition-colors duration-400 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:text-black/60">{description}</CardDescription>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-colors duration-400 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:text-black/80" />
        </div>
      </Card>
    </Link>
  );
}
