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

interface ArcadeSalesTabProps {
  data: Array<{ label: string; quantity: number }>;
}

// TODO: On the consolidated chart, the X-axis labels for the spend offers should just be
// "Spend $30", "Spend $50", "Spend $70", "Spend $100" (without the "Get $X" part),
// because the "Get" value varies by location. We'll handle the exact per-location offer
// names in tooltips or underlying data later.
export default function ArcadeSalesTab({ data }: ArcadeSalesTabProps) {
  // Transform data for chart (group by label)
  const chartData = data.map((item) => ({
    label: item.label,
    quantity: item.quantity,
  }));
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-2xl font-semibold text-[#0A0A0A] mb-6">
        Arcade Sales Snapshot
      </h2>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" />
            <XAxis
              dataKey="label"
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
            <Bar
              dataKey="quantity"
              fill="#6366F1"
              name="Quantity"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-sm text-[#6B7280]">No data available</p>
      )}
    </div>
  );
}

