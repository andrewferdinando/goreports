import Link from "next/link";
import { format } from 'date-fns';
import PageHeader from "@/components/PageHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { getWeeklyReports } from "@/lib/server/reports/getWeeklyReports";
import { ReportRow } from "./ReportRow";

const formatNzDate = (isoString?: string | null) => {
  if (!isoString) return '-';

  return new Date(isoString).toLocaleDateString('en-NZ', {
    timeZone: 'Pacific/Auckland',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export default async function WeeklyReportsPage() {
  const reports = await getWeeklyReports();

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
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#D1D5DB]">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-6 py-4 text-center text-sm text-[#374151]">
                  No reports found
                </td>
              </tr>
            ) : (
              reports.map((report) => {
                // Format report name: use period_start if available, otherwise fallback to label or '-'
                let reportName: string;
                if (report.period_start) {
                  reportName = `w/c ${format(new Date(report.period_start), 'd MMMM yyyy')}`;
                } else if (report.label) {
                  reportName = report.label;
                } else {
                  reportName = '-';
                }

                // Format created date in NZ timezone
                const createdDate = formatNzDate(report.created_at);

                return (
                  <ReportRow
                    key={report.id}
                    reportId={report.id}
                    reportName={reportName}
                    createdDate={createdDate}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

