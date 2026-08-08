import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  accent?: "blue" | "purple" | "teal" | "green" | "orange";
  sub?: ReactNode;
}

const accents = {
  blue: "bg-accent-blue/15 text-accent-blue",
  purple: "bg-accent-purple/15 text-accent-purple",
  teal: "bg-accent-teal/15 text-accent-teal",
  green: "bg-accent-green/15 text-accent-green",
  orange: "bg-accent-orange/15 text-accent-orange",
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
