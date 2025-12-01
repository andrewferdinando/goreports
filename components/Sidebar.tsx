"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Weekly Reports", href: "/weekly-reports" },
  { label: "Monthly Reports", href: "/monthly-reports" },
  { label: "Settings", href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] bg-white border-r border-[#D1D5DB] h-screen fixed left-0 top-0 flex flex-col">
      <div className="p-6 border-b border-[#D1D5DB]">
        <h1 className="text-lg font-semibold text-[#0A0A0A]">Go Reports</h1>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item, index) => {
            const isActive = pathname.startsWith(item.href);
            const isSettings = item.href === '/settings';
            return (
              <li key={item.href}>
                {isSettings && index > 0 && (
                  <div className="border-t border-[#D1D5DB] my-2"></div>
                )}
                <Link
                  href={item.href}
                  className={`block px-4 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-[#EEF2FF] text-[#6366F1] font-medium"
                      : "text-[#374151] hover:bg-gray-100"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

