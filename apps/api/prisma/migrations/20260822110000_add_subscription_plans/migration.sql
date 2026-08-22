ALTER TABLE "organizations" ADD COLUMN "subscription_plan" TEXT NOT NULL DEFAULT 'free';
ALTER TABLE "organizations" ADD COLUMN "subscription_expires" TIMESTAMP(3);
ALTER TABLE "organizations" ADD COLUMN "voucher_commission_pct" INTEGER NOT NULL DEFAULT 5;
