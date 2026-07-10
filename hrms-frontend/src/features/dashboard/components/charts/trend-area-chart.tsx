"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_AXIS_COLOR, CHART_GRID_COLOR } from "../../chart-colors";

export interface TrendSeries {
  key: string;
  label: string;
  color: string;
}

interface TrendAreaChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  series: TrendSeries[];
  xFormatter?: (value: string) => string;
}

export function TrendAreaChart({ data, xKey, series, xFormatter }: TrendAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={CHART_GRID_COLOR} vertical={false} />
        <XAxis
          dataKey={xKey}
          tickFormatter={xFormatter}
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
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          labelFormatter={(v) => (xFormatter ? xFormatter(String(v)) : String(v))}
        />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            fill={s.color}
            fillOpacity={0.15}
            strokeWidth={2}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
