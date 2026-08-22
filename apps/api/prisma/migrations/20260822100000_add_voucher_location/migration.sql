ALTER TABLE "vouchers" ADD COLUMN "locationId" TEXT;
CREATE INDEX "vouchers_locationId_idx" ON "vouchers"("locationId");
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
