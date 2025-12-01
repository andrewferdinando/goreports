import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { getWeeklyReports } from "@/lib/server/reports/getWeeklyReports";
import { ReportsTable } from "./ReportsTable";

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

      <ReportsTable reports={reports} />
    </div>
  );
}

