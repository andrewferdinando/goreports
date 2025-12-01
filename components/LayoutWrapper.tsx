'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { MobileNavbar } from '@/components/MobileNavbar';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex">
      <MobileNavbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 lg:ml-[220px] min-h-screen w-full lg:w-auto">
        <div className="max-w-6xl mx-auto p-4 lg:p-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}

