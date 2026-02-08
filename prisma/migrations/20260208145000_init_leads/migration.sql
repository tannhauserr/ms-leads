CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "leads" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "companyId" UUID,
  "source" VARCHAR(100) NOT NULL,
  "utmSource" VARCHAR(191),
  "utmMedium" VARCHAR(191),
  "utmCampaign" VARCHAR(191),
  "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "firstNameEnc" TEXT NOT NULL,
  "lastNameEnc" TEXT NOT NULL,
  "emailEnc" TEXT NOT NULL,
  "phoneEnc" TEXT NOT NULL,
  "messageEnc" TEXT,
  "companyName" VARCHAR(255) NOT NULL,
  "country" VARCHAR(120) NOT NULL,
  "businessType" VARCHAR(120) NOT NULL,
  "numberOfStaff" VARCHAR(120) NOT NULL,
  "emailHash" CHAR(64),
  "phoneHash" CHAR(64),
  CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_leads_company_created_at" ON "leads"("companyId", "createdDate");
CREATE INDEX "idx_leads_email_hash" ON "leads"("emailHash");
CREATE INDEX "idx_leads_phone_hash" ON "leads"("phoneHash");
