export function DashboardSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
