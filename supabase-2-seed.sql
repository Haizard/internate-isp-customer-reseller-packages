-- NetMaster: PART 2 of 2 — seed demo data.
-- Idempotent: safe to re-run.
-- MUST be run AFTER supabase-1-schema.sql has been executed.
--
-- Creates:
--   - NexusNet Arusha ISP organization
--   - SUPPORT_AGENT user: support@nexusnet.co.tz / password123

BEGIN;

-- 2a. Demo ISP organization
INSERT INTO "organizations" (
  "id", "name", "type", "parentOrgId", "status", "created_at", "updated_at"
)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'NexusNet Arusha',
  'ISP',
  NULL,
  'ACTIVE',
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

-- 2b. Demo support agent (bcrypt cost 10 for "password123")
INSERT INTO "users" (
  "id", "name", "email", "password_hash", "role", "organizationId",
  "customer_id", "created_at", "updated_at"
)
VALUES (
  '00000000-0000-4000-8000-000000000040',
  'Elena Support',
  'support@nexusnet.co.tz',
  '$2a$10$tt41Ro4VmYWu.619JneEHOVFmyeasTb85UtZFVYlhKx5/DEd.LSEW',
  'SUPPORT_AGENT',
  '00000000-0000-4000-8000-000000000001',
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT ("email") DO UPDATE
  SET "name"          = EXCLUDED."name",
      "password_hash" = EXCLUDED."password_hash",
      "role"          = EXCLUDED."role",
      "organizationId"= EXCLUDED."organizationId",
      "updated_at"    = NOW();

COMMIT;

-- Verify
SELECT id, name, email, role, "organizationId"
FROM "users"
WHERE email = 'support@nexusnet.co.tz';
