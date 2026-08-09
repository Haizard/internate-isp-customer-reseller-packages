export type AdapterKind = "simulator" | "mikrotik";

export interface AdapterCommandEnvelope {
  id: string;
  routerId: string;
  kind: "apply_profile" | "create_user" | "disconnect_user" | "heartbeat";
  payload: Record<string, unknown>;
  status: "PENDING" | "APPLIED" | "FAILED";
  createdAt: string;
  updatedAt: string;
}

export interface AdapterConfig {
  adapterKind: AdapterKind;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  pairingCode?: string;
  connectionMode: "simulator" | "api";
}

export interface AdapterCommandResult {
  commandId: string;
  routerId: string;
  status: "APPLIED" | "PENDING" | "FAILED";
  configurationVersion: number;
  message?: string;
}
