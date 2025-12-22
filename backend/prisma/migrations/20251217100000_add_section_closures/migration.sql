-- CreateTable
CREATE TABLE "SectionClosure" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SectionClosure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SectionClosure_sectionId_idx" ON "SectionClosure"("sectionId");

-- CreateIndex
CREATE INDEX "SectionClosure_startDate_endDate_idx" ON "SectionClosure"("startDate", "endDate");

-- AddForeignKey
ALTER TABLE "SectionClosure" ADD CONSTRAINT "SectionClosure_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add new audit actions to enum
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SECTION_CLOSURE_CREATE';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SECTION_CLOSURE_UPDATE';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SECTION_CLOSURE_DELETE';
