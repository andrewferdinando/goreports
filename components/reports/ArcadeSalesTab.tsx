"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// TODO: On the consolidated chart, the X-axis labels for the spend offers should just be
// "Spend $30", "Spend $50", "Spend $70", "Spend $100" (without the "Get $X" part),
// because the "Get" value varies by location. We'll handle the exact per-location offer
// names in tooltips or underlying data later.
const dummyData = [
  { offer: "Offer A", auckland: 45, christchurch: 32, queenstown: 28 },
  { offer: "Offer B", auckland: 52, christchurch: 38, queenstown: 35 },
  { offer: "Offer C", auckland: 38, christchurch: 42, queenstown: 31 },
  { offer: "Offer D", auckland: 61, christchurch: 55, queenstown: 48 },
  { offer: "Offer E", auckland: 29, christchurch: 33, queenstown: 25 },
  { offer: "Offer F", auckland: 47, christchurch: 41, queenstown: 39 },
  { offer: "Offer G", auckland: 55, christchurch: 49, queenstown: 44 },
];

export default function ArcadeSalesTab() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-2xl font-semibold text-[#0A0A0A] mb-6">
        Arcade Sales Snapshot
      </h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={dummyData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" />
          <XAxis
            dataKey="offer"
            tick={{ fill: "#6B7280", fontSize: 12 }}
            stroke="#D1D5DB"
          />
          <YAxis
            tick={{ fill: "#6B7280", fontSize: 12 }}
            stroke="#D1D5DB"
            label={{
              value: "Sales Count",
              angle: -90,
              position: "insideLeft",
              style: { textAnchor: "middle", fill: "#6B7280" },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: "20px" }}
            iconType="circle"
          />
          <Bar
            dataKey="auckland"
            fill="#6366F1"
            name="Auckland"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="christchurch"
            fill="#10B981"
            name="Christchurch"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="queenstown"
            fill="#F59E0B"
            name="Queenstown"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

