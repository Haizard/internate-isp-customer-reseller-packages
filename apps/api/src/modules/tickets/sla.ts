const SLA_TARGETS: Record<string, { respondHours: number; resolveHours: number }> = {
  URGENT: { respondHours: 1, resolveHours: 4 },
  HIGH: { respondHours: 4, resolveHours: 24 },
  MEDIUM: { respondHours: 24, resolveHours: 72 },
  LOW: { respondHours: 48, resolveHours: 120 },
};

export function slaFor(priority: string): { slaRespondBy: Date; slaResolveBy: Date } {
  const target = SLA_TARGETS[priority] ?? SLA_TARGETS.MEDIUM;
  const now = new Date();
  return {
    slaRespondBy: new Date(now.getTime() + target.respondHours * 3600 * 1000),
    slaResolveBy: new Date(now.getTime() + target.resolveHours * 3600 * 1000),
  };
}
