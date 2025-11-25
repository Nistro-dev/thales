-- DropIndex
DROP INDEX IF EXISTS "Product_qrCode_key";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN IF EXISTS "qrCode";
