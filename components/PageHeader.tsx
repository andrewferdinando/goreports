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
      <div className="text-sm text-[#6B7280] mb-4">{breadcrumb}</div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#0A0A0A]">{title}</h1>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}

