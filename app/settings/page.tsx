import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        breadcrumb="Home > Settings"
        title="Settings"
      />

      <p className="text-sm text-[#374151] mb-6">
        Manage how products from your CSV files are categorised.
      </p>

      <div className="space-y-4 max-w-2xl">
        <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-[#0A0A0A] mb-2">Product Rules</h2>
              <p className="text-sm text-[#374151]">
                Tell the app how to categorise new products.
              </p>
            </div>
            <Link href="/settings/product-rules">
              <PrimaryButton className="whitespace-nowrap w-full sm:w-auto">Manage rules</PrimaryButton>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-[#0A0A0A] mb-2">Users</h2>
              <p className="text-sm text-[#374151]">
                Choose which users appear in the Individual Arcade and Individual Sales reports.
              </p>
            </div>
            <Link href="/settings/users">
              <PrimaryButton className="whitespace-nowrap w-full sm:w-auto">Manage users</PrimaryButton>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

