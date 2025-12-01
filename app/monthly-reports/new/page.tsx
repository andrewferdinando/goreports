import PageHeader from "@/components/PageHeader";
import { ReportForm } from "./ReportForm";

export default function NewMonthlyReportPage() {
  return (
    <div>
      <PageHeader breadcrumb="Home > Monthly reports > New report" title="New report" />

      <div className="bg-white rounded-xl border border-gray-200 p-5 max-w-2xl">
        <ReportForm />
      </div>
    </div>
  );
}

