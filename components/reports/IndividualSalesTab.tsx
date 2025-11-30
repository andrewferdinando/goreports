"use client";

interface IndividualSale {
  name: string;
  comboPercentage: number;
  comboCount: number;
  venue: string;
}

const dummySales: IndividualSale[] = [
  { name: "Sarah Johnson", comboPercentage: 72, comboCount: 176, venue: "Auckland" },
  { name: "Mike Chen", comboPercentage: 68, comboCount: 162, venue: "Christchurch" },
  { name: "Emma Wilson", comboPercentage: 65, comboCount: 150, venue: "Auckland" },
  { name: "David Brown", comboPercentage: 58, comboCount: 115, venue: "Queenstown" },
  { name: "Lisa Anderson", comboPercentage: 55, comboCount: 106, venue: "Auckland" },
  { name: "Tom Martinez", comboPercentage: 52, comboCount: 96, venue: "Christchurch" },
  { name: "Alex Taylor", comboPercentage: 48, comboCount: 86, venue: "Queenstown" },
  { name: "Jordan Lee", comboPercentage: 45, comboCount: 74, venue: "Auckland" },
  { name: "Sam Davis", comboPercentage: 42, comboCount: 66, venue: "Christchurch" },
  { name: "Casey White", comboPercentage: 38, comboCount: 54, venue: "Queenstown" },
];

export default function IndividualSalesTab() {
  const getPillStyle = (comboPercentage: number) => {
    if (comboPercentage >= 60) {
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
        {dummySales.map((sale, index) => (
          <div
            key={`${sale.name}-${index}`}
            className={`flex items-center justify-between px-4 py-3 rounded-lg ${getPillStyle(
              sale.comboPercentage
            )}`}
          >
            <div className="flex items-center gap-4 flex-1">
              <span className="text-sm font-medium">{sale.name}</span>
              <span className="text-sm text-opacity-90">•</span>
              <span className="text-sm">{sale.venue}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-semibold">{sale.comboPercentage}%</div>
                <div className="text-xs opacity-90">combo rate</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{sale.comboCount}</div>
                <div className="text-xs opacity-90">combos</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

