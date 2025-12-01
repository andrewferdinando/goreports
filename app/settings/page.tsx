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

      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#0A0A0A] mb-2">Product Rules</h2>
            <p className="text-sm text-[#374151]">
              Tell the app how to categorise new products (combo, non combo, arcade, other).
            </p>
          </div>
          <Link href="/settings/product-rules">
            <PrimaryButton>Manage rules</PrimaryButton>
          </Link>
        </div>
      </div>
    </div>
  );
}

