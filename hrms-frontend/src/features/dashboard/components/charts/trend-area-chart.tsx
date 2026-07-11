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
        <defs>
          {series.map((s) => (
            <linearGradient key={`grad-${s.key}`} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0.0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke={CHART_GRID_COLOR} vertical={false} strokeDasharray="3 3" opacity={0.5} />
        <XAxis
          dataKey={xKey}
          tickFormatter={xFormatter}
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
          labelFormatter={(v) => (xFormatter ? xFormatter(String(v)) : String(v))}
        />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />}
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            fill={`url(#grad-${s.key})`}
            strokeWidth={2.5}
            activeDot={{ r: 6, strokeWidth: 0, fill: s.color }}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
