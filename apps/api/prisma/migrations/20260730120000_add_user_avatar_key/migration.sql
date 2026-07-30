-- Add private storage key for profile photos (served via signed URL on read).
ALTER TABLE "User" ADD COLUMN "avatarKey" TEXT;
