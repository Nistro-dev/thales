-- CreateEnum
CREATE TYPE "LegalPageType" AS ENUM ('TERMS', 'PRIVACY', 'LEGAL_NOTICE');

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'DATABASE_BACKUP';

-- CreateTable
CREATE TABLE "LegalPage" (
    "id" TEXT NOT NULL,
    "type" "LegalPageType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LegalPage_type_key" ON "LegalPage"("type");

-- CreateIndex
CREATE INDEX "LegalPage_type_idx" ON "LegalPage"("type");

-- AddForeignKey
ALTER TABLE "LegalPage" ADD CONSTRAINT "LegalPage_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
