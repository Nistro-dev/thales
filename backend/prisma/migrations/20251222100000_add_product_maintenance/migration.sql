-- Add new AuditAction enum values for Maintenance
ALTER TYPE "AuditAction" ADD VALUE 'MAINTENANCE_CREATE';
ALTER TYPE "AuditAction" ADD VALUE 'MAINTENANCE_UPDATE';
ALTER TYPE "AuditAction" ADD VALUE 'MAINTENANCE_END';
ALTER TYPE "AuditAction" ADD VALUE 'MAINTENANCE_CANCEL';

-- Add new AuditAction enum values for Backup
ALTER TYPE "AuditAction" ADD VALUE 'BACKUP_CREATE';
ALTER TYPE "AuditAction" ADD VALUE 'BACKUP_DELETE';
ALTER TYPE "AuditAction" ADD VALUE 'BACKUP_RESTORE';

-- Add new NotificationType enum value
ALTER TYPE "NotificationType" ADD VALUE 'RESERVATION_CANCELLED_MAINTENANCE';

-- CreateTable
CREATE TABLE "ProductMaintenance" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "reason" TEXT,
    "cancelledReservationsCount" INTEGER NOT NULL DEFAULT 0,
    "refundedCreditsTotal" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "endedAt" TIMESTAMP(3),
    "endedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductMaintenance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductMaintenance_productId_idx" ON "ProductMaintenance"("productId");

-- CreateIndex
CREATE INDEX "ProductMaintenance_startDate_idx" ON "ProductMaintenance"("startDate");

-- CreateIndex
CREATE INDEX "ProductMaintenance_endDate_idx" ON "ProductMaintenance"("endDate");

-- CreateIndex
CREATE INDEX "ProductMaintenance_productId_startDate_endDate_idx" ON "ProductMaintenance"("productId", "startDate", "endDate");

-- AddForeignKey
ALTER TABLE "ProductMaintenance" ADD CONSTRAINT "ProductMaintenance_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
