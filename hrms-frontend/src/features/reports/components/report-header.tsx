interface ReportHeaderProps {
  title: string;
  description: string;
  actions?: React.ReactNode;
}

export function ReportHeader({ title, description, actions }: ReportHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="mt-1 hidden text-lg font-semibold print:block">{title}</p>
      </div>
      {actions && <div className="flex items-center gap-2 print:hidden">{actions}</div>}
    </div>
  );
}
