'use client';

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface PageHeaderProps {
  breadcrumb: string;
  title: string;
  action?: ReactNode;
}

// Map breadcrumb labels to their corresponding routes
const breadcrumbRoutes: Record<string, string> = {
  'Home': '/',
  'Weekly reports': '/weekly-reports',
  'Monthly reports': '/monthly-reports',
  'Settings': '/settings',
  'Product Rules': '/settings/product-rules',
  'Users': '/settings/users',
  'New report': '', // Will be determined by current path
};

export default function PageHeader({
  breadcrumb,
  title,
  action,
}: PageHeaderProps) {
  const pathname = usePathname();
  
  // Parse breadcrumb string and create clickable links
  const breadcrumbParts = breadcrumb.split(' > ').map((part, index, array) => {
    const isLast = index === array.length - 1;
    let href = breadcrumbRoutes[part];
    
    // Handle "New report" - determine route based on current path
    if (part === 'New report' && !href) {
      if (pathname?.includes('/weekly-reports')) {
        href = '/weekly-reports/new';
      } else if (pathname?.includes('/monthly-reports')) {
        href = '/monthly-reports/new';
      }
    }
    
    // If no route found or it's the last item, don't make it a link
    if (!href || isLast) {
      return { label: part, href: null, isLast };
    }
    
    return { label: part, href, isLast };
  });

  return (
    <div className="mb-6">
      <nav className="text-xs lg:text-sm text-[#6B7280] mb-4" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          {breadcrumbParts.map((part, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 text-[#9CA3AF]">/</span>
              )}
              {part.href ? (
                <Link
                  href={part.href}
                  className="hover:text-[#6366F1] transition-colors underline-offset-2 hover:underline"
                >
                  {part.label}
                </Link>
              ) : (
                <span className={part.isLast ? 'text-[#374151] font-medium' : ''}>
                  {part.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl lg:text-3xl font-bold text-[#0A0A0A]">{title}</h1>
        {action && <div className="w-full sm:w-auto">{action}</div>}
      </div>
    </div>
  );
}

