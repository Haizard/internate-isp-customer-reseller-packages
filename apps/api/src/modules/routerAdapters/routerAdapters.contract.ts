export type AdapterKind = "simulator" | "mikrotik" | "openwrt";

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
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
}

export type AdapterQueryKind = "sessions" | "usage" | "health" | "capabilities";

export interface AdapterQueryEnvelope {
  routerId: string;
  kind: AdapterQueryKind;
}

export interface AdapterQueryResult {
  routerId: string;
  kind: AdapterQueryKind;
  status: "OK" | "FAILED";
  data: Record<string, unknown>;
  message?: string;
}

export interface AdapterConfig {
  adapterKind: AdapterKind;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  pairingCode?: string;
  connectionMode: "simulator" | "api" | "ssh";
  /** Simulator-only: simulate a gateway that cannot be reached. */
  simulateOffline?: boolean;
  /** Simulator-only: report expired customer sessions in session reads. */
  simulateExpiry?: boolean;
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
  query(query: AdapterQueryEnvelope): Promise<AdapterQueryResult>;
}
