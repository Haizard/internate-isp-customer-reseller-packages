export interface RouterAdapterCommandResult {
  routerId: string;
  adapterType: "simulator" | "mikrotik" | "openwrt";
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
  adapterType: "simulator" | "mikrotik" | "openwrt";
  connected: boolean;
  lastHeartbeatAt: string;
  status: "ACTIVE" | "OFFLINE";
}
