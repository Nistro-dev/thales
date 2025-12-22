-- CreateEnum
CREATE TYPE "CreditPeriod" AS ENUM ('DAY', 'WEEK');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "creditPeriod" "CreditPeriod" NOT NULL DEFAULT 'DAY';
