-- CreateEnum
CREATE TYPE "SlotType" AS ENUM ('CHECKOUT', 'RETURN');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'SECTION_TIMESLOT_CREATE';
ALTER TYPE "AuditAction" ADD VALUE 'SECTION_TIMESLOT_UPDATE';
ALTER TYPE "AuditAction" ADD VALUE 'SECTION_TIMESLOT_DELETE';

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "endTime" TEXT,
ADD COLUMN     "startTime" TEXT;

-- CreateTable
CREATE TABLE "TimeSlot" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "type" "SlotType" NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimeSlot_sectionId_idx" ON "TimeSlot"("sectionId");

-- CreateIndex
CREATE INDEX "TimeSlot_sectionId_type_dayOfWeek_idx" ON "TimeSlot"("sectionId", "type", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "TimeSlot" ADD CONSTRAINT "TimeSlot_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;
