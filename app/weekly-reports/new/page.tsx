import PageHeader from "@/components/PageHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";
import FileInputButton from "@/components/ui/FileInputButton";
import { createWeeklyReport } from "./actions";

export default function NewWeeklyReportPage() {
  return (
    <div>
      <PageHeader breadcrumb="Home > New report" title="New report" />

      <div className="bg-white rounded-xl border border-gray-200 p-5 max-w-2xl">
        <form action={createWeeklyReport} className="space-y-6">
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

          <div className="flex items-center justify-between">
            <label className="text-sm text-[#374151]">
              Add Auckland CSV
            </label>
            <FileInputButton
              id="auckland-csv"
              name="csv_auckland"
              accept=".csv"
              label="+ Add CSV"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm text-[#374151]">
              Add Christchurch CSV
            </label>
            <FileInputButton
              id="christchurch-csv"
              name="csv_christchurch"
              accept=".csv"
              label="+ Add CSV"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm text-[#374151]">
              Add Queenstown CSV
            </label>
            <FileInputButton
              id="queenstown-csv"
              name="csv_queenstown"
              accept=".csv"
              label="+ Add CSV"
            />
          </div>

          <div className="mt-6">
            <PrimaryButton type="submit">Submit</PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
