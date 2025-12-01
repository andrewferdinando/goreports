'use client';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ReportRow } from './ReportRow';
import { MonthlyReport } from '@/lib/server/reports/getMonthlyReports';

const formatNzDate = (isoString?: string | null) => {
  if (!isoString) return '-';

  return new Date(isoString).toLocaleDateString('en-NZ', {
    timeZone: 'Pacific/Auckland',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

interface ReportsTableProps {
  reports: MonthlyReport[];
}

export function ReportsTable({ reports }: ReportsTableProps) {
  const router = useRouter();

  const handleDelete = () => {
    router.refresh();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-[#D1D5DB]">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
              Report Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
              Period
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
              Created Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-[#D1D5DB]">
          {reports.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-4 text-center text-sm text-[#374151]">
                No reports found
              </td>
            </tr>
          ) : (
            reports.map((report) => {
              // Format report name: use period_start if available, otherwise fallback to label or '-'
              let reportName: string;
              let period: string;
              if (report.period_start) {
                const periodDate = new Date(report.period_start);
                reportName = format(periodDate, 'MMMM yyyy');
                period = format(periodDate, 'MMMM yyyy');
              } else if (report.label) {
                reportName = report.label;
                period = report.label;
              } else {
                reportName = '-';
                period = '-';
              }

              // Format created date in NZ timezone
              const createdDate = formatNzDate(report.created_at);

              return (
                <ReportRow
                  key={report.id}
                  reportId={report.id}
                  reportName={reportName}
                  period={period}
                  createdDate={createdDate}
                  onDelete={handleDelete}
                />
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

