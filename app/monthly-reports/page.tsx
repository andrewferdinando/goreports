import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { getMonthlyReports } from "@/lib/server/reports/getMonthlyReports";
import { ReportsTable } from "./ReportsTable";

export default async function MonthlyReportsPage() {
  const reports = await getMonthlyReports();

  return (
    <div>
      <PageHeader
        breadcrumb="Home > Monthly reports"
        title="Monthly reports"
        action={
          <Link href="/monthly-reports/new">
            <PrimaryButton>+ New Report</PrimaryButton>
          </Link>
        }
      />

      <ReportsTable reports={reports} />
    </div>
  );
}

