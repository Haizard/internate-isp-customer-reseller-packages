"use client";

interface BarChartProps {
  data: { label: string; value: number }[];
  accent?: string;
  height?: number;
  formatValue?: (v: number) => string;
}

export function BarChart({
  data,
  accent = "#0A84FF",
  height = 160,
  formatValue = (v) => String(v),
}: BarChartProps) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div>
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d, i) => {
          const h = Math.max((d.value / max) * height, 3);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group min-w-0">
              <span className="text-[10px] text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {formatValue(d.value)}
              </span>
              <div
                className="w-full rounded-t-md transition-opacity group-hover:opacity-80"
                style={{
                  height: h,
                  background: `linear-gradient(180deg, ${accent}, ${accent}66)`,
                  boxShadow: `0 4px 10px ${accent}33`,
                  opacity: 0.8 + (d.value / max) * 0.2,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 mt-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[10px] text-text-tertiary truncate">
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
