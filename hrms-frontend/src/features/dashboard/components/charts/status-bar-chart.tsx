"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_AXIS_COLOR, CHART_GRID_COLOR } from "../../chart-colors";

interface StatusBarChartProps {
  data: { label: string; count: number; color: string }[];
}

export function StatusBarChart({ data }: StatusBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: CHART_AXIS_COLOR }}
          axisLine={{ stroke: CHART_GRID_COLOR }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12, fill: CHART_AXIS_COLOR }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={false}>
          {data.map((entry) => (
            <Cell key={entry.label} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
