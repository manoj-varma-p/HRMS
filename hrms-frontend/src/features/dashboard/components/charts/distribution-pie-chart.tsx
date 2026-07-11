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
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
