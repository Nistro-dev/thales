/*
  Warnings:

  - You are about to drop the column `color` on the `Section` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'MAINTENANCE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FileVisibility" AS ENUM ('PUBLIC', 'ADMIN');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'SECTION_CREATE';
ALTER TYPE "AuditAction" ADD VALUE 'SECTION_UPDATE';
ALTER TYPE "AuditAction" ADD VALUE 'SECTION_DELETE';
ALTER TYPE "AuditAction" ADD VALUE 'SUBSECTION_CREATE';
ALTER TYPE "AuditAction" ADD VALUE 'SUBSECTION_UPDATE';
ALTER TYPE "AuditAction" ADD VALUE 'SUBSECTION_DELETE';
ALTER TYPE "AuditAction" ADD VALUE 'PRODUCT_CREATE';
ALTER TYPE "AuditAction" ADD VALUE 'PRODUCT_UPDATE';
ALTER TYPE "AuditAction" ADD VALUE 'PRODUCT_DELETE';
ALTER TYPE "AuditAction" ADD VALUE 'PRODUCT_STATUS_CHANGE';
ALTER TYPE "AuditAction" ADD VALUE 'PRODUCT_FILE_UPLOAD';
ALTER TYPE "AuditAction" ADD VALUE 'PRODUCT_FILE_DELETE';

-- DropForeignKey
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_sectionId_fkey";

-- AlterTable
ALTER TABLE "Section" DROP COLUMN "color",
ADD COLUMN     "allowedDaysIn" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[],
ADD COLUMN     "allowedDaysOut" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[],
ADD COLUMN     "isSystem" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "SubSection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sectionId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "reference" TEXT,
    "priceCredits" INTEGER NOT NULL,
    "minDuration" INTEGER NOT NULL DEFAULT 1,
    "maxDuration" INTEGER NOT NULL DEFAULT 14,
    "status" "ProductStatus" NOT NULL DEFAULT 'AVAILABLE',
    "sectionId" TEXT NOT NULL,
    "subSectionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAttribute" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductFile" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "s3Key" TEXT NOT NULL,
    "visibility" "FileVisibility" NOT NULL DEFAULT 'PUBLIC',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubSection_sectionId_idx" ON "SubSection"("sectionId");

-- CreateIndex
CREATE INDEX "Product_sectionId_idx" ON "Product"("sectionId");

-- CreateIndex
CREATE INDEX "Product_subSectionId_idx" ON "Product"("subSectionId");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- CreateIndex
CREATE INDEX "ProductAttribute_productId_idx" ON "ProductAttribute"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAttribute_productId_key_key" ON "ProductAttribute"("productId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "ProductFile_s3Key_key" ON "ProductFile"("s3Key");

-- CreateIndex
CREATE INDEX "ProductFile_productId_idx" ON "ProductFile"("productId");

-- CreateIndex
CREATE INDEX "ProductFile_sortOrder_idx" ON "ProductFile"("sortOrder");

-- CreateIndex
CREATE INDEX "Section_isSystem_idx" ON "Section"("isSystem");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubSection" ADD CONSTRAINT "SubSection_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_subSectionId_fkey" FOREIGN KEY ("subSectionId") REFERENCES "SubSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAttribute" ADD CONSTRAINT "ProductAttribute_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFile" ADD CONSTRAINT "ProductFile_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
