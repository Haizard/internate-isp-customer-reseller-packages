import type { ReactNode } from "react";

type BadgeTone = "green" | "orange" | "red" | "gray" | "blue" | "purple" | "teal";

const tones: Record<BadgeTone, string> = {
  green: "bg-accent-green/15 text-accent-green",
  orange: "bg-accent-orange/15 text-accent-orange",
  red: "bg-accent-red/15 text-accent-red",
  gray: "bg-status-offline/15 text-status-offline",
  blue: "bg-accent-blue/15 text-accent-blue",
  purple: "bg-accent-purple/15 text-accent-purple",
  teal: "bg-accent-teal/15 text-accent-teal",
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
