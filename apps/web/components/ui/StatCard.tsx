import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  accent?: "blue" | "purple" | "teal" | "green" | "orange";
  sub?: ReactNode;
}

const accents = {
  blue: "bg-[rgba(10,132,255,0.15)] text-[#0A84FF]",
  purple: "bg-[rgba(191,90,242,0.15)] text-[#BF5AF2]",
  teal: "bg-[rgba(64,200,224,0.15)] text-[#40C8E0]",
  green: "bg-[rgba(48,209,88,0.15)] text-[#30D158]",
  orange: "bg-[rgba(255,159,10,0.15)] text-[#FF9F0A]",
};

export function StatCard({ label, value, icon, accent = "blue", sub }: StatCardProps) {
  return (
    <div className="glass rounded-lg shadow-sm p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-footnote font-medium text-text-secondary">{label}</p>
          <p className="text-title-1 font-bold mt-1 text-text-primary">{value}</p>
          {sub && <p className="text-caption text-text-tertiary mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${accents[accent]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
