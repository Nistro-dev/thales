-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('CONFIRMED', 'CHECKED_OUT', 'RETURNED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'RESERVATION_CREATE';
ALTER TYPE "AuditAction" ADD VALUE 'RESERVATION_CANCEL';
ALTER TYPE "AuditAction" ADD VALUE 'RESERVATION_CHECKOUT';
ALTER TYPE "AuditAction" ADD VALUE 'RESERVATION_RETURN';
ALTER TYPE "AuditAction" ADD VALUE 'RESERVATION_REFUND';
ALTER TYPE "AuditAction" ADD VALUE 'RESERVATION_UPDATE';

-- AlterTable
ALTER TABLE "CreditTransaction" ADD COLUMN     "reservationId" TEXT;

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "creditsCharged" INTEGER NOT NULL,
    "checkedOutAt" TIMESTAMP(3),
    "checkedOutBy" TEXT,
    "returnedAt" TIMESTAMP(3),
    "returnedBy" TEXT,
    "notes" TEXT,
    "adminNotes" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "cancelledBy" TEXT,
    "refundedAt" TIMESTAMP(3),
    "refundedBy" TEXT,
    "refundAmount" INTEGER,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reservation_userId_idx" ON "Reservation"("userId");

-- CreateIndex
CREATE INDEX "Reservation_productId_idx" ON "Reservation"("productId");

-- CreateIndex
CREATE INDEX "Reservation_status_idx" ON "Reservation"("status");

-- CreateIndex
CREATE INDEX "Reservation_startDate_idx" ON "Reservation"("startDate");

-- CreateIndex
CREATE INDEX "Reservation_endDate_idx" ON "Reservation"("endDate");

-- CreateIndex
CREATE INDEX "Reservation_startDate_endDate_idx" ON "Reservation"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "CreditTransaction_reservationId_idx" ON "CreditTransaction"("reservationId");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
