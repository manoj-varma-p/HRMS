"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_AXIS_COLOR, CHART_GRID_COLOR } from "../../chart-colors";
import { TrendSeries } from "./trend-area-chart";

interface TrendBarChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  series: TrendSeries[];
}

export function TrendBarChart({ data, xKey, series }: TrendBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={CHART_GRID_COLOR} vertical={false} strokeDasharray="3 3" opacity={0.5} />
        <XAxis
          dataKey={xKey}
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
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />}
        {series.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            fill={s.color}
            radius={[6, 6, 0, 0]}
            maxBarSize={45}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
