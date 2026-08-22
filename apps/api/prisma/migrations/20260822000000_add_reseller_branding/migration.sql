-- AlterTable: Add branding column to organizations
ALTER TABLE "organizations" ADD COLUMN "branding" JSONB;

-- Set default branding for existing resellers
UPDATE "organizations" SET "branding" = '{"brandName": "My Network", "primaryColor": "#0A84FF", "welcomeMessage": "Welcome to our network"}' WHERE "type" = 'RESELLER';
