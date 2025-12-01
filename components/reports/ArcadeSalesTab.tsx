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
  data: Array<{
    product: string;
    auckland: number;
    christchurch: number;
    queenstown: number;
  }>;
}

export default function ArcadeSalesTab({ data }: ArcadeSalesTabProps) {
  // Transform data for grouped bar chart
  // X-axis: product labels, Y-axis: values, grouped by venue
  const chartData = data.map((item) => ({
    product: item.product,
    Auckland: item.auckland,
    Christchurch: item.christchurch,
    Queenstown: item.queenstown,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-5">
      <h2 className="text-xl lg:text-2xl font-semibold text-[#0A0A0A] mb-4 lg:mb-6">
        Arcade Sales Snapshot
      </h2>
      {chartData.length > 0 ? (
        <div className="w-full overflow-x-auto">
          <ResponsiveContainer width="100%" height={400} minWidth={300}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" />
            <XAxis
              dataKey="product"
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
              wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
              iconType="circle"
            />
            <Bar
              dataKey="Auckland"
              fill="#6366F1"
              name="Auckland"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="Christchurch"
              fill="#8B5CF6"
              name="Christchurch"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="Queenstown"
              fill="#EC4899"
              name="Queenstown"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-xs lg:text-sm text-[#6B7280]">No data available</p>
      )}
    </div>
  );
}

