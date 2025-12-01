import { ReactNode } from "react";

interface PageHeaderProps {
  breadcrumb: string;
  title: string;
  action?: ReactNode;
}

export default function PageHeader({
  breadcrumb,
  title,
  action,
}: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="text-xs lg:text-sm text-[#6B7280] mb-4">{breadcrumb}</div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl lg:text-3xl font-bold text-[#0A0A0A]">{title}</h1>
        {action && <div className="w-full sm:w-auto">{action}</div>}
      </div>
    </div>
  );
}

