/*
  Warnings:

  - The `status` column on the `Claim` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('pending', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "Claim" DROP COLUMN "status",
ADD COLUMN     "status" "ClaimStatus" NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "status" "ItemStatus" NOT NULL DEFAULT 'OPEN';
