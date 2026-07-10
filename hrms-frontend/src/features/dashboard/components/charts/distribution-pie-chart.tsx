"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export interface PieSlice {
  name: string;
  value: number;
  color: string;
}

export function DistributionPieChart({ data }: { data: PieSlice[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="55%"
          outerRadius="80%"
          paddingAngle={2}
          isAnimationActive={false}
        >
          {data.map((slice) => (
            <Cell key={slice.name} fill={slice.color} stroke="none" />
          ))}
        </Pie>
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
