"use client";

import { useId } from "react";
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface BarChartProps {
  data: { label: string; value: number }[];
  accent?: string;
  height?: number;
  formatValue?: (v: number) => string;
}

function compact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return String(Math.round(value));
}

export function BarChart({
  data,
  accent = "#0A84FF",
  height = 200,
  formatValue = (v) => String(v),
}: BarChartProps) {
  const gradientId = `barchart-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  if (data.length === 0) return null;

  const showLabels = data.length <= 12;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 18, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity={0.95} />
            <stop offset="100%" stopColor={accent} stopOpacity={0.35} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(60, 60, 67, 0.12)" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          interval={showLabels ? 0 : "preserveStartEnd"}
          tick={{ fontSize: 11, fill: "#8e8e93" }}
          dy={6}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={(v: number) => compact(v)}
          tick={{ fontSize: 11, fill: "#8e8e93" }}
        />
        <Tooltip
          cursor={{ fill: "rgba(10, 132, 255, 0.06)" }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const value = payload[0].value as number;
            return (
              <div className="glass-strong rounded-lg px-3 py-2 shadow-lg">
                <p className="text-caption font-semibold text-text-secondary">{label}</p>
                <p className="text-callout font-bold mt-0.5" style={{ color: accent }}>
                  {formatValue(value)}
                </p>
              </div>
            );
          }}
        />
        <Bar dataKey="value" fill={`url(#${gradientId})`} radius={[7, 7, 0, 0]} animationDuration={600}>
          {data.map((d) => (
            <Cell key={d.label} />
          ))}
          {showLabels && (
            <LabelList
              dataKey="value"
              position="top"
              formatter={(v) => compact(Number(v))}
              style={{ fontSize: 10, fill: "#6e6e73", fontWeight: 600 }}
            />
          )}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
