"use client";

import Link from "next/link";
import PageHeader from "@/components/PageHeader";

interface MonthlyReport {
  id: number;
  name: string;
  month: string;
  createdDate: string;
  createdBy: string;
}

const dummyMonthlyReports: MonthlyReport[] = [
  {
    id: 1,
    name: "November 2025",
    month: "November 2025",
    createdDate: "01/12/2025",
    createdBy: "Mickey",
  },
];

export default function MonthlyReportsPage() {
  return (
    <div>
      <PageHeader
        breadcrumb="Home > Monthly reports"
        title="Monthly reports"
        action={
          <button
            disabled
            className="bg-white border border-gray-300 text-[#374151] text-sm font-semibold h-11 px-5 rounded-lg cursor-not-allowed opacity-50"
          >
            + New Report
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-[#D1D5DB]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                Report Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                Month
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                Created Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                Created By
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#D1D5DB]">
            {dummyMonthlyReports.map((report) => (
              <tr key={report.id} className="hover:bg-gray-50 hover:shadow-md transition-all">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#0A0A0A]">
                  {report.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#374151]">
                  {report.month}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#374151]">
                  {report.createdDate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#374151]">
                  {report.createdBy}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

