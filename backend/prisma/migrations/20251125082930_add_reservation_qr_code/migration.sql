/*
  Warnings:

  - A unique constraint covering the columns `[qrCode]` on the table `Reservation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "qrCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_qrCode_key" ON "Reservation"("qrCode");

-- CreateIndex
CREATE INDEX "Reservation_qrCode_idx" ON "Reservation"("qrCode");
