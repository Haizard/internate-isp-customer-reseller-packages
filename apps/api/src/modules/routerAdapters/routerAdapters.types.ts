export interface RouterAdapterCommandResult {
  routerId: string;
  adapterType: "simulator";
  status: "APPLIED" | "PENDING" | "FAILED";
  configurationVersion: number;
  appliedProfile: {
    packageName: string;
    speedMbps: number;
    dataCapGb: number;
  };
  appliedAt: string;
}

export interface RouterAdapterStatus {
  routerId: string;
  adapterType: "simulator";
  connected: boolean;
  lastHeartbeatAt: string;
  status: "ACTIVE" | "OFFLINE";
}
