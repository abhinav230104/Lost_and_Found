-- Add missing updatedAt column expected by Prisma schema.
ALTER TABLE "Item"
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
