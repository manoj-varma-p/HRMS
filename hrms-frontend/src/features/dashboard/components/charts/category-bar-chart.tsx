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
          tick={{ fontSize: 12, fill: CHART_AXIS_COLOR }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} isAnimationActive={false}>
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
