-- AlterEnum
ALTER TYPE "CreditTransactionType" ADD VALUE 'PENALTY';

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'RESERVATION_PENALTY';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'RESERVATION_PENALIZED';

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN "penalizedAt" TIMESTAMP(3),
ADD COLUMN "penalizedBy" TEXT,
ADD COLUMN "penaltyAmount" INTEGER,
ADD COLUMN "penaltyReason" TEXT;
