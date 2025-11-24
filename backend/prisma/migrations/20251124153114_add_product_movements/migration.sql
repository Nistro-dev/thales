/*
  Warnings:

  - A unique constraint covering the columns `[qrCode]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('CHECKOUT', 'RETURN');

-- CreateEnum
CREATE TYPE "ProductCondition" AS ENUM ('OK', 'MINOR_DAMAGE', 'MAJOR_DAMAGE', 'MISSING_PARTS', 'BROKEN');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "lastCondition" "ProductCondition" NOT NULL DEFAULT 'OK',
ADD COLUMN     "lastMovementAt" TIMESTAMP(3),
ADD COLUMN     "qrCode" TEXT;

-- CreateTable
CREATE TABLE "ProductMovement" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "reservationId" TEXT,
    "type" "MovementType" NOT NULL,
    "condition" "ProductCondition" NOT NULL DEFAULT 'OK',
    "notes" TEXT,
    "photoKey" TEXT,
    "performedBy" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductMovement_productId_idx" ON "ProductMovement"("productId");

-- CreateIndex
CREATE INDEX "ProductMovement_reservationId_idx" ON "ProductMovement"("reservationId");

-- CreateIndex
CREATE INDEX "ProductMovement_type_idx" ON "ProductMovement"("type");

-- CreateIndex
CREATE INDEX "ProductMovement_performedAt_idx" ON "ProductMovement"("performedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Product_qrCode_key" ON "Product"("qrCode");

-- AddForeignKey
ALTER TABLE "ProductMovement" ADD CONSTRAINT "ProductMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
