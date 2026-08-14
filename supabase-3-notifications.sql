-- NetMaster: PART 3 of 3 — add the customer notifications table.
-- Idempotent: safe to re-run.
-- Run this AFTER supabase-1-schema.sql and supabase-2-seed.sql have succeeded.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    CREATE TABLE "notifications" (
      "id" TEXT NOT NULL,
      "customer_id" TEXT NOT NULL,
      "ticket_id" TEXT,
      "kind" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "body" TEXT NOT NULL,
      "read_at" TIMESTAMP(3),
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "created_by_user_id" TEXT,
      "updated_by_user_id" TEXT,
      "deleted_at" TIMESTAMP(3),
      CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "notifications_customer_id_read_at_idx" ON "notifications"("customer_id", "read_at");
CREATE INDEX IF NOT EXISTS "notifications_ticket_id_idx" ON "notifications"("ticket_id");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_customer_id_fkey') THEN
    ALTER TABLE "notifications"
      ADD CONSTRAINT "notifications_customer_id_fkey"
      FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_ticket_id_fkey') THEN
    ALTER TABLE "notifications"
      ADD CONSTRAINT "notifications_ticket_id_fkey"
      FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
