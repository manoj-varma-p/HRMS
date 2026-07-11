"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CATEGORICAL_CHART_COLORS, CHART_AXIS_COLOR } from "../../chart-colors";

interface CategoryBarChartProps {
  data: { name: string; count: number }[];
}

export function CategoryBarChart({ data }: CategoryBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
      >
        <XAxis type="number" allowDecimals={false} hide />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tick={{ fontSize: 11, fill: CHART_AXIS_COLOR, fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 10,
            backgroundColor: "rgba(23, 23, 23, 0.8)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
            color: "#fff"
          }}
        />
        <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={30} isAnimationActive={false}>
          {data.map((entry, index) => (
            <Cell
              key={entry.name}
              fill={CATEGORICAL_CHART_COLORS[index % CATEGORICAL_CHART_COLORS.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
