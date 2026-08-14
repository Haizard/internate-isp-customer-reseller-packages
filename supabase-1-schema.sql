-- NetMaster: PART 1 of 2 — schema only.
-- Idempotent: safe to re-run.
--
-- Creates the full NetMaster schema (init + support migration).
-- The ALTER TYPE that adds SUPPORT_AGENT is intentionally outside any
-- transaction so it auto-commits; run that single line first if you
-- hit enum errors. After this succeeds, run supabase-2-seed.sql.

-- =============================================================
-- 1. SCHEMA (from apps/api/prisma/migrations)
-- =============================================================

-- CreateEnum (wrapped so re-runs are safe)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrganizationType') THEN
    CREATE TYPE "OrganizationType" AS ENUM ('ISP', 'RESELLER');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
    CREATE TYPE "UserRole" AS ENUM ('PLATFORM_OWNER', 'ISP_ADMIN', 'RESELLER', 'CUSTOMER');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RouterStatus') THEN
    CREATE TYPE "RouterStatus" AS ENUM ('ACTIVE', 'OFFLINE', 'SUSPENDED');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CustomerStatus') THEN
    CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VoucherStatus') THEN
    CREATE TYPE "VoucherStatus" AS ENUM ('UNUSED', 'USED', 'EXPIRED');
  END IF;
END $$;

-- Support migration enums
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketStatus') THEN
    CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'PENDING_CUSTOMER', 'RESOLVED', 'CLOSED');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketPriority') THEN
    CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketSource') THEN
    CREATE TYPE "TicketSource" AS ENUM ('CUSTOMER', 'RESELLER', 'SUPPORT', 'SYSTEM');
  END IF;
END $$;

-- Add SUPPORT_AGENT to UserRole.
-- IMPORTANT: keep this statement OUTSIDE any transaction. Run it
-- separately if Supabase's editor wraps queries in one.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPPORT_AGENT';

-- CreateTable: wrap each CREATE TABLE in a DO block
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
    CREATE TABLE "organizations" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "type" "OrganizationType" NOT NULL,
      "parentOrgId" TEXT,
      "status" TEXT NOT NULL DEFAULT 'ACTIVE',
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL,
      "created_by_user_id" TEXT,
      "updated_by_user_id" TEXT,
      "deleted_at" TIMESTAMP(3),
      CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    CREATE TABLE "users" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "password_hash" TEXT NOT NULL,
      "role" "UserRole" NOT NULL,
      "organizationId" TEXT NOT NULL,
      "customer_id" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL,
      "created_by_user_id" TEXT,
      "updated_by_user_id" TEXT,
      CONSTRAINT "users_pkey" PRIMARY KEY ("id")
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'locations') THEN
    CREATE TABLE "locations" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "address" TEXT,
      "organizationId" TEXT NOT NULL,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL,
      "created_by_user_id" TEXT,
      "updated_by_user_id" TEXT,
      CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'router_devices') THEN
    CREATE TABLE "router_devices" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "macAddress" TEXT NOT NULL,
      "status" "RouterStatus" NOT NULL DEFAULT 'ACTIVE',
      "locationId" TEXT NOT NULL,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL,
      "created_by_user_id" TEXT,
      "updated_by_user_id" TEXT,
      CONSTRAINT "router_devices_pkey" PRIMARY KEY ("id")
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'packages') THEN
    CREATE TABLE "packages" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "speedMbps" INTEGER NOT NULL,
      "dataCapGb" INTEGER,
      "priceCents" INTEGER NOT NULL,
      "currency" TEXT NOT NULL DEFAULT 'TZS',
      "organizationId" TEXT NOT NULL,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL,
      "created_by_user_id" TEXT,
      "updated_by_user_id" TEXT,
      CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bandwidth_rules') THEN
    CREATE TABLE "bandwidth_rules" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "downloadMbps" INTEGER NOT NULL,
      "uploadMbps" INTEGER NOT NULL,
      "priority" INTEGER NOT NULL DEFAULT 0,
      "packageId" TEXT NOT NULL,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL,
      "created_by_user_id" TEXT,
      "updated_by_user_id" TEXT,
      CONSTRAINT "bandwidth_rules_pkey" PRIMARY KEY ("id")
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
    CREATE TABLE "customers" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "phone" TEXT NOT NULL,
      "wifiSsid" TEXT,
      "wifiPassword" TEXT,
      "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
      "routerId" TEXT NOT NULL,
      "organizationId" TEXT NOT NULL,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL,
      "created_by_user_id" TEXT,
      "updated_by_user_id" TEXT,
      "deleted_at" TIMESTAMP(3),
      CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
    CREATE TABLE "subscriptions" (
      "id" TEXT NOT NULL,
      "customerId" TEXT NOT NULL,
      "packageId" TEXT NOT NULL,
      "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "renews_at" TIMESTAMP(3),
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL,
      "created_by_user_id" TEXT,
      "updated_by_user_id" TEXT,
      CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vouchers') THEN
    CREATE TABLE "vouchers" (
      "id" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "organizationId" TEXT NOT NULL,
      "dataGb" INTEGER,
      "durationHours" INTEGER,
      "status" "VoucherStatus" NOT NULL DEFAULT 'UNUSED',
      "usedByCustomerId" TEXT,
      "expiresAt" TIMESTAMP(3),
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL,
      "created_by_user_id" TEXT,
      "updated_by_user_id" TEXT,
      CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'devices') THEN
    CREATE TABLE "devices" (
      "id" TEXT NOT NULL,
      "customerId" TEXT NOT NULL,
      "macAddress" TEXT NOT NULL,
      "deviceName" TEXT,
      "last_seen_at" TIMESTAMP(3),
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL,
      "created_by_user_id" TEXT,
      "updated_by_user_id" TEXT,
      CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    CREATE TABLE "audit_logs" (
      "id" TEXT NOT NULL,
      "actorUserId" TEXT,
      "action" TEXT NOT NULL,
      "entityType" TEXT NOT NULL,
      "entityId" TEXT NOT NULL,
      "beforeJson" JSONB,
      "afterJson" JSONB,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usage_records') THEN
    CREATE TABLE "usage_records" (
      "id" TEXT NOT NULL,
      "customerId" TEXT NOT NULL,
      "day" TIMESTAMP(3) NOT NULL,
      "bytes_used" BIGINT NOT NULL DEFAULT 0,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL,
      "created_by_user_id" TEXT,
      "updated_by_user_id" TEXT,
      CONSTRAINT "usage_records_pkey" PRIMARY KEY ("id")
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_requests') THEN
    CREATE TABLE "service_requests" (
      "id" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'OPEN',
      "message" TEXT,
      "customerId" TEXT NOT NULL,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL,
      "created_by_user_id" TEXT,
      "updated_by_user_id" TEXT,
      CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id")
    );
  END IF;
END $$;

-- Support/helpdesk tables
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tickets') THEN
    CREATE TABLE "tickets" (
      "id" TEXT NOT NULL,
      "subject" TEXT NOT NULL,
      "description" TEXT,
      "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
      "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
      "source" "TicketSource" NOT NULL DEFAULT 'SUPPORT',
      "entityType" TEXT,
      "entityId" TEXT,
      "organizationId" TEXT NOT NULL,
      "assigneeId" TEXT,
      "requesterId" TEXT,
      "sla_respond_by" TIMESTAMP(3),
      "sla_resolve_by" TIMESTAMP(3),
      "first_response_at" TIMESTAMP(3),
      "resolved_at" TIMESTAMP(3),
      "closed_at" TIMESTAMP(3),
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL,
      "created_by_user_id" TEXT,
      "updated_by_user_id" TEXT,
      "deleted_at" TIMESTAMP(3),
      CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ticket_comments') THEN
    CREATE TABLE "ticket_comments" (
      "id" TEXT NOT NULL,
      "ticket_id" TEXT NOT NULL,
      "author_id" TEXT,
      "authorRole" TEXT NOT NULL,
      "body" TEXT NOT NULL,
      "is_internal" BOOLEAN NOT NULL DEFAULT false,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ticket_comments_pkey" PRIMARY KEY ("id")
    );
  END IF;
END $$;

-- CreateIndex (IF NOT EXISTS is native)
CREATE INDEX IF NOT EXISTS "organizations_parentOrgId_idx" ON "organizations"("parentOrgId");
CREATE INDEX IF NOT EXISTS "organizations_type_status_idx" ON "organizations"("type", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "users_customer_id_key" ON "users"("customer_id");
CREATE INDEX IF NOT EXISTS "users_organizationId_idx" ON "users"("organizationId");
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");
CREATE INDEX IF NOT EXISTS "locations_organizationId_idx" ON "locations"("organizationId");
CREATE UNIQUE INDEX IF NOT EXISTS "router_devices_macAddress_key" ON "router_devices"("macAddress");
CREATE INDEX IF NOT EXISTS "router_devices_locationId_idx" ON "router_devices"("locationId");
CREATE INDEX IF NOT EXISTS "packages_organizationId_idx" ON "packages"("organizationId");
CREATE INDEX IF NOT EXISTS "bandwidth_rules_packageId_idx" ON "bandwidth_rules"("packageId");
CREATE INDEX IF NOT EXISTS "customers_routerId_idx" ON "customers"("routerId");
CREATE INDEX IF NOT EXISTS "customers_organizationId_status_idx" ON "customers"("organizationId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_customerId_key" ON "subscriptions"("customerId");
CREATE INDEX IF NOT EXISTS "subscriptions_packageId_idx" ON "subscriptions"("packageId");
CREATE UNIQUE INDEX IF NOT EXISTS "vouchers_code_key" ON "vouchers"("code");
CREATE INDEX IF NOT EXISTS "vouchers_organizationId_status_idx" ON "vouchers"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "devices_customerId_idx" ON "devices"("customerId");
CREATE INDEX IF NOT EXISTS "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "audit_logs_actorUserId_idx" ON "audit_logs"("actorUserId");
CREATE INDEX IF NOT EXISTS "usage_records_customerId_day_idx" ON "usage_records"("customerId", "day");
CREATE INDEX IF NOT EXISTS "service_requests_customerId_idx" ON "service_requests"("customerId");
CREATE INDEX IF NOT EXISTS "tickets_organizationId_status_idx" ON "tickets"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "tickets_assigneeId_status_idx" ON "tickets"("assigneeId", "status");
CREATE INDEX IF NOT EXISTS "tickets_entityType_entityId_idx" ON "tickets"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "ticket_comments_ticket_id_created_at_idx" ON "ticket_comments"("ticket_id", "created_at");

-- AddForeignKey (wrapped, only if missing)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'organizations_parentOrgId_fkey') THEN
    ALTER TABLE "organizations" ADD CONSTRAINT "organizations_parentOrgId_fkey" FOREIGN KEY ("parentOrgId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_organizationId_fkey') THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_customer_id_fkey') THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'locations_organizationId_fkey') THEN
    ALTER TABLE "locations" ADD CONSTRAINT "locations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'router_devices_locationId_fkey') THEN
    ALTER TABLE "router_devices" ADD CONSTRAINT "router_devices_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'packages_organizationId_fkey') THEN
    ALTER TABLE "packages" ADD CONSTRAINT "packages_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bandwidth_rules_packageId_fkey') THEN
    ALTER TABLE "bandwidth_rules" ADD CONSTRAINT "bandwidth_rules_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customers_routerId_fkey') THEN
    ALTER TABLE "customers" ADD CONSTRAINT "customers_routerId_fkey" FOREIGN KEY ("routerId") REFERENCES "router_devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customers_organizationId_fkey') THEN
    ALTER TABLE "customers" ADD CONSTRAINT "customers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_customerId_fkey') THEN
    ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_packageId_fkey') THEN
    ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vouchers_organizationId_fkey') THEN
    ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'devices_customerId_fkey') THEN
    ALTER TABLE "devices" ADD CONSTRAINT "devices_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usage_records_customerId_fkey') THEN
    ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_requests_customerId_fkey') THEN
    ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tickets_organizationId_fkey') THEN
    ALTER TABLE "tickets" ADD CONSTRAINT "tickets_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tickets_assigneeId_fkey') THEN
    ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tickets_requesterId_fkey') THEN
    ALTER TABLE "tickets" ADD CONSTRAINT "tickets_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ticket_comments_ticket_id_fkey') THEN
    ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- =============================================================
-- END OF SCHEMA. Run supabase-2-seed.sql after this succeeds.
-- =============================================================

