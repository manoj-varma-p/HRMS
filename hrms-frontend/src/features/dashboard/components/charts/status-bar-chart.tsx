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
          tick={{ fontSize: 11, fill: CHART_AXIS_COLOR, fontWeight: 500 }}
          axisLine={{ stroke: CHART_GRID_COLOR }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
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
        <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={45} isAnimationActive={false}>
          {data.map((entry) => (
            <Cell key={entry.label} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
