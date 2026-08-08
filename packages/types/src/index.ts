export type OrganizationType = "ISP" | "RESELLER";

export type UserRole = "PLATFORM_OWNER" | "ISP_ADMIN" | "RESELLER" | "CUSTOMER";

export type RouterStatus = "ACTIVE" | "OFFLINE" | "SUSPENDED";

export type CustomerStatus = "ACTIVE" | "SUSPENDED" | "PENDING";

export type VoucherStatus = "UNUSED" | "USED" | "EXPIRED";

export type OrgStatus = "ACTIVE" | "SUSPENDED" | "PENDING_APPROVAL";

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  parentOrgId: string | null;
  status: OrgStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  organization?: Pick<Organization, "id" | "name" | "type" | "status">;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  name: string;
  address: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Router {
  id: string;
  name: string;
  macAddress: string;
  status: RouterStatus;
  locationId: string;
  location?: Pick<Location, "id" | "name">;
  customerCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Package {
  id: string;
  name: string;
  speedMbps: number;
  dataCapGb: number | null;
  priceCents: number;
  currency: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  wifiSsid: string | null;
  wifiPassword: string | null;
  status: CustomerStatus;
  routerId: string;
  router?: Pick<Router, "id" | "name" | "macAddress">;
  subscription?: Subscription | null;
  devices?: Device[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Subscription {
  id: string;
  customerId: string;
  packageId: string;
  package?: Package;
  startedAt: string;
  renewsAt: string | null;
}

export interface Voucher {
  id: string;
  code: string;
  organizationId: string;
  dataGb: number | null;
  durationHours: number | null;
  status: VoucherStatus;
  usedByCustomerId: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface Device {
  id: string;
  customerId: string;
  macAddress: string;
  deviceName: string | null;
  lastSeenAt: string | null;
}

export interface AuditLog {
  id: string;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeJson: unknown | null;
  afterJson: unknown | null;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
}
