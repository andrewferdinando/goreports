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
} from '@/lib/server/reports/metrics';
import { getIndividualSalesStats } from '@/lib/server/reports/getIndividualSalesStats';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

interface MonthlyReportDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MonthlyReportDetailPage({
  params,
}: MonthlyReportDetailPageProps) {
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
  const [arcadeSales, individualArcade, locationCombo, individualSales] = await Promise.all([
    getArcadeSales(reportId),
    getIndividualArcade(reportId),
    getLocationComboByVenue(reportId),
    getIndividualSalesStats(reportId),
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
      content: <IndividualSalesTab data={individualSales} />,
    },
  ];

  return (
    <div>
      <PageHeader
        breadcrumb={`Home > Monthly reports > ${reportName}`}
        title={reportName}
      />
      <Tabs tabs={tabs} />
    </div>
  );
}

