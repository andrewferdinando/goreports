"use client";

interface IndividualArcadeTabProps {
  data: Array<{ name: string; total: number; locationCode?: string }>;
}

export default function IndividualArcadeTab({ data }: IndividualArcadeTabProps) {
  const getPillStyle = (rank: number) => {
    if (rank <= 3) {
      return "bg-[#10B981] text-white";
    } else if (rank >= 8) {
      return "bg-[#EF4444] text-white";
    }
    return "bg-gray-100 text-[#374151]";
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-2xl font-semibold text-[#0A0A0A] mb-6">
        Individual Arcade Performance
      </h2>
      <div className="space-y-3">
        {data.length > 0 ? (
          data.map((performer, index) => {
            const rank = index + 1;
            return (
              <div
                key={`${performer.name}-${rank}`}
                className={`flex items-center justify-between px-4 py-3 rounded-lg ${getPillStyle(
                  rank
                )}`}
              >
                <span className="text-sm font-medium uppercase tracking-wide">
                  {performer.name} {performer.total} CARDS{performer.locationCode ? ` – ${performer.locationCode}` : ''}
                </span>
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

