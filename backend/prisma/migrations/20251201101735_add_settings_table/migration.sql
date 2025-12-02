/*
  Warnings:

  - The values [RESERVATION_EXTEND_REQUEST,RESERVATION_EXTEND_APPROVE,RESERVATION_EXTEND_REJECT] on the enum `AuditAction` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `photoKey` on the `ProductMovement` table. All the data in the column will be lost.
  - You are about to drop the column `extensionApprovedAt` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `extensionCost` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `extensionHandledBy` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `extensionNewEndDate` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `extensionReason` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `extensionRejectedAt` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `extensionRequestedAt` on the `Reservation` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AuditAction_new" AS ENUM ('LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_COMPLETE', 'TOKEN_REFRESH', 'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'USER_STATUS_CHANGE', 'INVITATION_CREATE', 'INVITATION_CANCEL', 'INVITATION_COMPLETE', 'CREDIT_ADJUST', 'CAUTION_VALIDATE', 'CAUTION_EXEMPT', 'CAUTION_RESET', 'ROLE_CREATE', 'ROLE_UPDATE', 'ROLE_DELETE', 'ROLE_ASSIGN', 'ROLE_REVOKE', 'SECTION_CREATE', 'SECTION_UPDATE', 'SECTION_DELETE', 'SUBSECTION_CREATE', 'SUBSECTION_UPDATE', 'SUBSECTION_DELETE', 'PRODUCT_CREATE', 'PRODUCT_UPDATE', 'PRODUCT_DELETE', 'PRODUCT_STATUS_CHANGE', 'PRODUCT_FILE_UPLOAD', 'PRODUCT_FILE_DELETE', 'RESERVATION_CREATE', 'RESERVATION_CANCEL', 'RESERVATION_CHECKOUT', 'RESERVATION_RETURN', 'RESERVATION_REFUND', 'RESERVATION_UPDATE', 'RESERVATION_EXTEND');
ALTER TABLE "AuditLog" ALTER COLUMN "action" TYPE "AuditAction_new" USING ("action"::text::"AuditAction_new");
ALTER TYPE "AuditAction" RENAME TO "AuditAction_old";
ALTER TYPE "AuditAction_new" RENAME TO "AuditAction";
DROP TYPE "AuditAction_old";
COMMIT;

-- DropIndex
DROP INDEX "Reservation_extensionRequestedAt_idx";

-- AlterTable
ALTER TABLE "ProductMovement" DROP COLUMN "photoKey";

-- AlterTable
ALTER TABLE "Reservation" DROP COLUMN "extensionApprovedAt",
DROP COLUMN "extensionCost",
DROP COLUMN "extensionHandledBy",
DROP COLUMN "extensionNewEndDate",
DROP COLUMN "extensionReason",
DROP COLUMN "extensionRejectedAt",
DROP COLUMN "extensionRequestedAt",
ADD COLUMN     "extensionCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalExtensionCost" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "encrypted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

-- CreateIndex
CREATE INDEX "Setting_key_idx" ON "Setting"("key");
