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
        <CartesianGrid stroke={CHART_GRID_COLOR} vertical={false} />
        <XAxis
          dataKey={xKey}
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
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            fill={s.color}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
