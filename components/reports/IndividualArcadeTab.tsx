"use client";

interface StaffPerformance {
  name: string;
  sales: number;
  rank: number;
}

const dummyStaff: StaffPerformance[] = [
  { name: "Sarah Johnson", sales: 245, rank: 1 },
  { name: "Mike Chen", sales: 238, rank: 2 },
  { name: "Emma Wilson", sales: 231, rank: 3 },
  { name: "David Brown", sales: 198, rank: 4 },
  { name: "Lisa Anderson", sales: 192, rank: 5 },
  { name: "Tom Martinez", sales: 185, rank: 6 },
  { name: "Alex Taylor", sales: 179, rank: 7 },
  { name: "Jordan Lee", sales: 165, rank: 8 },
  { name: "Sam Davis", sales: 158, rank: 9 },
  { name: "Casey White", sales: 142, rank: 10 },
];

export default function IndividualArcadeTab() {
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
        {dummyStaff.map((staff) => (
          <div
            key={staff.name}
            className={`flex items-center justify-between px-4 py-3 rounded-lg ${getPillStyle(
              staff.rank
            )}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">#{staff.rank}</span>
              <span className="text-sm font-medium">{staff.name}</span>
            </div>
            <span className="text-sm font-semibold">{staff.sales} sales</span>
          </div>
        ))}
      </div>
    </div>
  );
}

