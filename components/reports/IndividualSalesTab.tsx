"use client";

interface IndividualSalesTabProps {
  data: Array<{
    locationName: string;
    staffName: string;
    comboSales: number;
    nonComboSales: number;
    totalSales: number;
    comboRate: number; // 0–1
  }>;
}

export default function IndividualSalesTab({ data }: IndividualSalesTabProps) {
  const getPillStyle = (comboRate: number) => {
    // combo_rate ≥ 60% → green card
    // combo_rate < 60% → red card
    if (comboRate >= 0.6) {
      return "bg-[#10B981] text-white";
    }
    return "bg-[#EF4444] text-white";
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-2xl font-semibold text-[#0A0A0A] mb-6">
        Individual Sales Performance
      </h2>
      <div className="space-y-3">
        {data.length > 0 ? (
          data.map((sale, index) => {
            const comboPercent = Math.round(sale.comboRate * 100);
            return (
              <div
                key={`${sale.staffName}-${sale.locationName}-${index}`}
                className={`flex items-center justify-between px-4 py-3 rounded-lg ${getPillStyle(
                  sale.comboRate
                )}`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <span className="text-sm font-medium">
                    {sale.staffName} – {sale.locationName}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-semibold">{comboPercent}%</div>
                    <div className="text-xs opacity-90">combo rate</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{sale.comboSales}</div>
                    <div className="text-xs opacity-90">combos</div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-[#6B7280]">No data available</p>
        )}
      </div>
    </div>
  );
}

