import type { ReactNode } from "react";

type BadgeTone = "green" | "orange" | "red" | "gray" | "blue" | "purple" | "teal";

const tones: Record<BadgeTone, string> = {
  green: "bg-[rgba(48,209,88,0.15)] text-[#30D158]",
  orange: "bg-[rgba(255,159,10,0.15)] text-[#FF9F0A]",
  red: "bg-[rgba(255,69,58,0.15)] text-[#FF453A]",
  gray: "bg-[rgba(142,142,147,0.15)] text-[#8E8E93]",
  blue: "bg-[rgba(10,132,255,0.15)] text-[#0A84FF]",
  purple: "bg-[rgba(191,90,242,0.15)] text-[#BF5AF2]",
  teal: "bg-[rgba(64,200,224,0.15)] text-[#40C8E0]",
};

export function statusTone(status: string): BadgeTone {
  const s = status.toUpperCase();
  if (s.includes("ACTIVE") || s.includes("ONLINE") || s === "USED") return "green";
  if (s.includes("PENDING") || s.includes("OPEN")) return "orange";
  if (s.includes("SUSPENDED") || s.includes("EXPIRED")) return "red";
  if (s.includes("UNUSED")) return "blue";
  return "gray";
}

export function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-pill text-caption font-medium tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone(status)}>{status.toLowerCase()}</Badge>;
}
