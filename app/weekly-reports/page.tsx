"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";

interface Report {
  id: number;
  name: string;
  createdDate: string;
  createdBy: string;
}

const dummyReports: Report[] = [
  {
    id: 1,
    name: "w/c 23 November 2025",
    createdDate: "01/12/2025",
    createdBy: "Mickey",
  },
];

export default function WeeklyReportsPage() {
  const router = useRouter();

  return (
    <div>
      <PageHeader
        breadcrumb="Home > Weekly reports"
        title="Weekly reports"
        action={
          <Link href="/weekly-reports/new">
            <PrimaryButton>+ New Report</PrimaryButton>
          </Link>
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
                Created Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                Created By
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#D1D5DB]">
            {dummyReports.map((report) => (
              <tr
                key={report.id}
                onClick={() => router.push(`/weekly-reports/${report.id}`)}
                className="hover:bg-gray-50 hover:shadow-md cursor-pointer transition-all"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#0A0A0A]">
                  {report.name}
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

