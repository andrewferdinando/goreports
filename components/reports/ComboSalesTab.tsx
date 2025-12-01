"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface ComboSalesTabProps {
  data: Array<{
    locationName: string;
    locationCode: string;
    combo: number;
    nonCombo: number;
    comboPercent: number;
    rank: number;
  }>;
}

const COLORS = ["#6366F1", "#D1D5DB"];

const getRankBadge = (rank: number) => {
  const badges = {
    1: { text: "1st", color: "bg-[#10B981]" },
    2: { text: "2nd", color: "bg-[#F59E0B]" },
    3: { text: "3rd", color: "bg-[#EF4444]" },
  };
  return badges[rank as keyof typeof badges] || { text: `${rank}th`, color: "bg-gray-400" };
};

export default function ComboSalesTab({ data }: ComboSalesTabProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-5">
      <h2 className="text-xl lg:text-2xl font-semibold text-[#0A0A0A] mb-4 lg:mb-6">
        Combo Sales by Venue
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {data.length > 0 ? (
          data.map((venue) => {
            const total = venue.combo + venue.nonCombo;
            const chartData = [
              { name: "Combo", value: venue.combo },
              { name: "Non-Combo", value: venue.nonCombo },
            ];
            const badge = getRankBadge(venue.rank);

            return (
              <div
                key={venue.locationCode}
                className="bg-gray-50 rounded-xl border border-gray-200 p-4 lg:p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#0A0A0A]">
                    {venue.locationName}
                  </h3>
                  <span
                    className={`${badge.color} text-white text-xs font-semibold px-2 py-1 rounded`}
                  >
                    {badge.text}
                  </span>
                </div>
                <div className="text-sm text-[#6B7280] mb-4">
                  {venue.combo} combos
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #D1D5DB",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 text-center">
                  <span className="text-2xl font-bold text-[#0A0A0A]">
                    {venue.comboPercent}%
                  </span>
                  <span className="text-sm text-[#6B7280] ml-2">combo rate</span>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-xs lg:text-sm text-[#6B7280]">No data available</p>
        )}
      </div>
    </div>
  );
}

