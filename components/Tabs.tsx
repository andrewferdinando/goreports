"use client";

import { useState, ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
}

export default function Tabs({ tabs }: TabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "");

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div>
      <div className="border-b border-[#D1D5DB] mb-6">
        <nav className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-4 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? "text-[#6366F1] bg-[#EEF2FF] border-b-2 border-[#6366F1]"
                  : "text-[#6B7280] hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div>{activeTabContent}</div>
    </div>
  );
}

