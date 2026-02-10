/*
  Warnings:

  - You are about to drop the column `companyId` on the `leads` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "idx_leads_company_created_at";

-- AlterTable
ALTER TABLE "leads" DROP COLUMN "companyId",
ALTER COLUMN "id" DROP DEFAULT;
