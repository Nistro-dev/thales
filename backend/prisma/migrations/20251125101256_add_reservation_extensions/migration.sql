-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'RESERVATION_EXTEND_REQUEST';
ALTER TYPE "AuditAction" ADD VALUE 'RESERVATION_EXTEND_APPROVE';
ALTER TYPE "AuditAction" ADD VALUE 'RESERVATION_EXTEND_REJECT';

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "extensionApprovedAt" TIMESTAMP(3),
ADD COLUMN     "extensionCost" INTEGER,
ADD COLUMN     "extensionHandledBy" TEXT,
ADD COLUMN     "extensionNewEndDate" DATE,
ADD COLUMN     "extensionReason" TEXT,
ADD COLUMN     "extensionRejectedAt" TIMESTAMP(3),
ADD COLUMN     "extensionRequestedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Reservation_extensionRequestedAt_idx" ON "Reservation"("extensionRequestedAt");
