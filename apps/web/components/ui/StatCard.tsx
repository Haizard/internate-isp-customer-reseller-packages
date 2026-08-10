import type { ReactNode } from "react";
import type { IconTone } from "./Icon";

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  accent?: IconTone;
  sub?: ReactNode;
}

const tileGradients: Record<IconTone, string> = {
  blue: "linear-gradient(135deg, #5aa7ff 0%, #0a84ff 55%, #0063d6 100%)",
  green: "linear-gradient(135deg, #5ddb78 0%, #2fb45c 55%, #1d9c46 100%)",
  orange: "linear-gradient(135deg, #ffc24d 0%, #ff9f0a 55%, #f2761e 100%)",
  red: "linear-gradient(135deg, #ff6b62 0%, #ff453a 55%, #dd2f26 100%)",
  purple: "linear-gradient(135deg, #d88ff7 0%, #bf5af2 55%, #9a34d6 100%)",
  teal: "linear-gradient(135deg, #6fd9ec 0%, #40c8e0 55%, #17a9c9 100%)",
  gray: "linear-gradient(135deg, #c7c7cc 0%, #8e8e93 100%)",
};

export function StatCard({ label, value, icon, accent = "blue", sub }: StatCardProps) {
  return (
    <div className={`glass card-tint card-tint-${accent} rounded-lg shadow-sm p-4`}>
      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-footnote font-medium text-text-secondary">{label}</p>
          <p className="text-title-1 font-bold mt-1 text-text-primary truncate">{value}</p>
          {sub && <p className="text-caption text-text-tertiary mt-1 truncate">{sub}</p>}
        </div>
        <span
          className="w-10 h-10 rounded-[14px] flex items-center justify-center text-white shrink-0"
          style={{ background: tileGradients[accent], boxShadow: "0 4px 14px rgba(10, 50, 120, 0.22)" }}
        >
          {icon}
        </span>
      </div>
    </div>
  );
}
