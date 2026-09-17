import { ReactNode } from "react";

interface AdminPageHeaderProps {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  breadcrumbs?: string[];
}

export function AdminPageHeader({
  title,
  subtitle,
  actions,
  breadcrumbs,
}: AdminPageHeaderProps) {
  return (
    <div className="mb-8">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold text-[#71809a]">
          {breadcrumbs.map((crumb, i) => (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-[#d0d8e6]">/</span>}
              <span className={i === breadcrumbs.length - 1 ? "text-primary" : ""}>
                {crumb}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-[1fr_auto] items-start gap-4 sm:items-end">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.04em] text-[#182643] sm:text-[34px]">
            {title}
          </h1>
          <p className="mt-2 text-sm text-[#6c7890]">{subtitle}</p>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}
