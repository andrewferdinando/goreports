'use client';

import { useRouter } from 'next/navigation';

interface ReportRowProps {
  reportId: string;
  reportName: string;
  createdDate: string;
}

export function ReportRow({ reportId, reportName, createdDate }: ReportRowProps) {
  const router = useRouter();

  return (
    <tr
      onClick={() => router.push(`/weekly-reports/${reportId}`)}
      className="hover:bg-gray-50 hover:shadow-md cursor-pointer transition-all"
    >
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#0A0A0A]">
        {reportName}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#374151]">
        {createdDate}
      </td>
    </tr>
  );
}

