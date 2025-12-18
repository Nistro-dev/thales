-- CreateTable
CREATE TABLE "RoleSection" (
    "roleId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleSection_pkey" PRIMARY KEY ("roleId","sectionId")
);

-- CreateIndex
CREATE INDEX "RoleSection_roleId_idx" ON "RoleSection"("roleId");

-- CreateIndex
CREATE INDEX "RoleSection_sectionId_idx" ON "RoleSection"("sectionId");

-- AddForeignKey
ALTER TABLE "RoleSection" ADD CONSTRAINT "RoleSection_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleSection" ADD CONSTRAINT "RoleSection_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;
