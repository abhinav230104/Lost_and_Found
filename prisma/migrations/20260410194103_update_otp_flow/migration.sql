/*
  Warnings:

  - You are about to drop the column `verified` on the `OTP` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OTP" DROP COLUMN "verified",
ADD COLUMN     "name" TEXT,
ADD COLUMN     "password" TEXT;
