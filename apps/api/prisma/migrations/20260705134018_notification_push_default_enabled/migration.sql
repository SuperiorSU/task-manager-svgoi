-- AlterTable
ALTER TABLE "NotificationPreference" ALTER COLUMN "pushEnabled" SET DEFAULT true;

-- Backfill: existing false values were only ever set by the old default
-- (the mobile settings toggle for this field was never wired to the real API),
-- so no real user opt-out is being overridden here.
UPDATE "NotificationPreference" SET "pushEnabled" = true WHERE "pushEnabled" = false;
