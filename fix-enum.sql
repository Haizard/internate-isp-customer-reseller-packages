-- NetMaster: ensure UserRole enum has SUPPORT_AGENT.
-- Run this ALONE (no other statements in the same query).
-- Supabase SQL editor auto-commits each query, so we leave the
-- ALTER TYPE outside any explicit transaction.

ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPPORT_AGENT';

-- After this succeeds, run supabase-2-seed.sql.
-- Verify with this (run as a separate query afterwards):
--   SELECT enum_range(NULL::"UserRole");
-- The result must include SUPPORT_AGENT.