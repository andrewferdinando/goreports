"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Weekly Reports", href: "/weekly-reports" },
  { label: "Monthly Reports", href: "/monthly-reports" },
  { label: "Settings", href: "/settings" },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();

  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`
          w-[220px] bg-white border-r border-[#D1D5DB] h-screen fixed left-0 top-0 flex flex-col z-50
          lg:translate-x-0 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-6 border-b border-[#D1D5DB] lg:block hidden">
          <h1 className="text-lg font-semibold text-[#0A0A0A]">GO Reports</h1>
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
                    onClick={handleLinkClick}
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
    </>
  );
}

