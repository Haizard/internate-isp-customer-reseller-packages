import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-5 gap-3">
      <div className="min-w-0">
        <h1 className="text-gradient text-title-1 font-bold md:text-large-title">{title}</h1>
        {subtitle && <p className="text-callout text-text-secondary mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
