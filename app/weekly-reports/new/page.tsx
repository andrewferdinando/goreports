import PageHeader from "@/components/PageHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { createWeeklyReport } from "./actions";
import { CsvUploadFields } from "./CsvUploadFields";

export default function NewWeeklyReportPage() {
  return (
    <div>
      <PageHeader breadcrumb="Home > New report" title="New report" />

      <div className="bg-white rounded-xl border border-gray-200 p-5 max-w-2xl">
        <form action={createWeeklyReport} className="space-y-6" encType="multipart/form-data">
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">
              Week start
            </label>
            <input
              type="date"
              name="period_start"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              required
            />
          </div>

          <CsvUploadFields />

          <div className="mt-6">
            <PrimaryButton type="submit">Submit</PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
