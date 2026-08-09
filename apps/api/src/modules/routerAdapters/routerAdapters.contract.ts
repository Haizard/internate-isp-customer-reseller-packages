export type AdapterKind = "simulator" | "mikrotik";

export type RouterAdapterCommandKind =
  | "apply_profile"
  | "create_user"
  | "create_voucher"
  | "disconnect_user"
  | "heartbeat"
  | "create_queue"
  | "create_pool"
  | "create_pppoe_profile"
  | "create_hotspot_profile";

export interface AdapterCommandEnvelope {
  id: string;
  routerId: string;
  kind: RouterAdapterCommandKind;
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

export interface RouterAdapter {
  readonly kind: AdapterKind;
  connect(): Promise<unknown>;
  execute(command: AdapterCommandEnvelope): Promise<AdapterCommandResult>;
}
