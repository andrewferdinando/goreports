"use client";

import { useParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import Tabs from "@/components/Tabs";

export default function WeeklyReportDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const reportName = "w/c 23 November 2025";

  const tabs = [
    {
      id: "arcade-sales",
      label: "Arcade Sales",
      content: (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-2xl font-semibold text-[#0A0A0A] mb-4">
            Arcade Sales
          </h2>
          <p className="text-sm text-[#374151]">Chart / table will go here</p>
        </div>
      ),
    },
    {
      id: "individual-arcade",
      label: "Individual Arcade",
      content: (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-2xl font-semibold text-[#0A0A0A] mb-4">
            Individual Arcade
          </h2>
          <p className="text-sm text-[#374151]">Chart / table will go here</p>
        </div>
      ),
    },
    {
      id: "combo-sales",
      label: "Combo Sales",
      content: (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-2xl font-semibold text-[#0A0A0A] mb-4">
            Combo Sales
          </h2>
          <p className="text-sm text-[#374151]">Chart / table will go here</p>
        </div>
      ),
    },
    {
      id: "individual-sales",
      label: "Individual Sales",
      content: (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-2xl font-semibold text-[#0A0A0A] mb-4">
            Individual Sales
          </h2>
          <p className="text-sm text-[#374151]">Chart / table will go here</p>
        </div>
      ),
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

