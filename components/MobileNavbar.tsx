'use client';

import { useState } from 'react';

interface MobileNavbarProps {
  onMenuClick: () => void;
}

export function MobileNavbar({ onMenuClick }: MobileNavbarProps) {
  return (
    <nav className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-[#D1D5DB] z-40 flex items-center justify-between px-4">
      <h1 className="text-lg font-semibold text-[#0A0A0A]">GO Reports</h1>
      <button
        onClick={onMenuClick}
        className="p-2 text-[#374151] hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Open menu"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
      </button>
    </nav>
  );
}

