"use client";

import { useParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import Tabs from "@/components/Tabs";
import ArcadeSalesTab from "@/components/reports/ArcadeSalesTab";
import IndividualArcadeTab from "@/components/reports/IndividualArcadeTab";
import ComboSalesTab from "@/components/reports/ComboSalesTab";
import IndividualSalesTab from "@/components/reports/IndividualSalesTab";

export default function WeeklyReportDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const reportName = "w/c 23 November 2025";

  const tabs = [
    {
      id: "arcade-sales",
      label: "Arcade Sales",
      content: <ArcadeSalesTab />,
    },
    {
      id: "individual-arcade",
      label: "Individual Arcade",
      content: <IndividualArcadeTab />,
    },
    {
      id: "combo-sales",
      label: "Combo Sales",
      content: <ComboSalesTab />,
    },
    {
      id: "individual-sales",
      label: "Individual Sales",
      content: <IndividualSalesTab />,
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

