import { notFound } from 'next/navigation';
import PageHeader from "@/components/PageHeader";
import Tabs from "@/components/Tabs";
import ArcadeSalesTab from "@/components/reports/ArcadeSalesTab";
import IndividualArcadeTab from "@/components/reports/IndividualArcadeTab";
import ComboSalesTab from "@/components/reports/ComboSalesTab";
import IndividualSalesTab from "@/components/reports/IndividualSalesTab";
import {
  getArcadeSales,
  getIndividualArcade,
  getLocationComboByVenue,
  getIndividualComboPercent,
} from '@/lib/server/reports/metrics';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

interface WeeklyReportDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function WeeklyReportDetailPage({
  params,
}: WeeklyReportDetailPageProps) {
  const { id } = await params;
  const reportId = id;

  // Fetch report to get label
  const supabase = getSupabaseServerClient();
  const { data: report } = await supabase
    .from('reports')
    .select('label')
    .eq('id', reportId)
    .single();

  if (!report) {
    notFound();
  }

  const reportName = report.label as string;

  // Fetch all metrics data
  const [arcadeSales, individualArcade, locationCombo, individualCombo] = await Promise.all([
    getArcadeSales(reportId),
    getIndividualArcade(reportId),
    getLocationComboByVenue(reportId),
    getIndividualComboPercent(reportId),
  ]);

  const tabs = [
    {
      id: "arcade-sales",
      label: "Arcade Sales",
      content: <ArcadeSalesTab data={arcadeSales} />,
    },
    {
      id: "individual-arcade",
      label: "Individual Arcade",
      content: <IndividualArcadeTab data={individualArcade} />,
    },
    {
      id: "combo-sales",
      label: "Combo Sales",
      content: <ComboSalesTab data={locationCombo} />,
    },
    {
      id: "individual-sales",
      label: "Individual Sales",
      content: <IndividualSalesTab data={individualCombo} />,
    },
  ];

  return (
    <div>
      <PageHeader
        breadcrumb={`Home > Weekly reports > ${reportName}`}
        title={reportName}
      />
      <Tabs tabs={tabs} />
    </div>
  );
}
