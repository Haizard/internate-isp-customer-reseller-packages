export interface RouterAdapterLifecycleState {
  routerId: string;
  adapterKind: "simulator" | "mikrotik";
  pendingCommands: number;
  reconciliation: {
    id: string;
    status: "PENDING" | "APPLIED" | "FAILED";
    desiredJson: Record<string, unknown>;
    appliedJson: Record<string, unknown>;
  };
}
