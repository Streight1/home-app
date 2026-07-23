CREATE TYPE "DocumentType" AS ENUM (
  'GENERAL', 'INVOICE', 'RECEIPT', 'CONTRACT', 'WARRANTY', 'INSURANCE',
  'MANUAL', 'VEHICLE_DOCUMENT', 'PROPERTY_DOCUMENT', 'UTILITY_BILL',
  'PERSONAL', 'OTHER'
);

CREATE TYPE "ExtractionType" AS ENUM ('STRUCTURED_DATA');
CREATE TYPE "ExtractionJobStatus" AS ENUM (
  'QUEUED', 'PROCESSING', 'REVIEW_REQUIRED', 'COMPLETED', 'FAILED', 'CANCELLED'
);
CREATE TYPE "ExtractionFieldStatus" AS ENUM ('PROPOSED', 'ACCEPTED', 'EDITED', 'REJECTED');

CREATE TABLE "DocumentFolder" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "householdId" UUID NOT NULL,
  "parentId" UUID,
  "name" VARCHAR(100) NOT NULL,
  "normalizedName" VARCHAR(100) NOT NULL,
  "createdByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DocumentFolder_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Document"
  ADD COLUMN "folderId" UUID,
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "type" "DocumentType" NOT NULL DEFAULT 'GENERAL',
  ADD COLUMN "metadataJson" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "metadataSchemaVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "metadataOriginsJson" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "documentDate" DATE;

ALTER TABLE "DocumentFile"
  ADD COLUMN "sanitizedFilename" VARCHAR(200),
  ADD COLUMN "extension" VARCHAR(20),
  ADD COLUMN "detectedMimeType" VARCHAR(150),
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

UPDATE "DocumentFile"
SET
  "sanitizedFilename" = "originalFilename",
  "extension" = COALESCE(lower(substring("originalFilename" FROM '\.([^.]+)$')), ''),
  "detectedMimeType" = "mimeType";

ALTER TABLE "DocumentFile"
  ALTER COLUMN "sanitizedFilename" SET NOT NULL,
  ALTER COLUMN "extension" SET NOT NULL,
  ALTER COLUMN "detectedMimeType" SET NOT NULL;

CREATE TABLE "ExtractionJob" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "householdId" UUID NOT NULL,
  "documentId" UUID NOT NULL,
  "documentFileId" UUID NOT NULL,
  "extractionType" "ExtractionType" NOT NULL DEFAULT 'STRUCTURED_DATA',
  "status" "ExtractionJobStatus" NOT NULL DEFAULT 'QUEUED',
  "extractorKey" VARCHAR(100) NOT NULL,
  "extractorVersion" VARCHAR(50) NOT NULL,
  "schemaVersion" INTEGER NOT NULL,
  "requestedByUserId" UUID NOT NULL,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "errorCode" VARCHAR(100),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExtractionJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExtractionResult" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "jobId" UUID NOT NULL,
  "rawText" TEXT,
  "structuredDataJson" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExtractionResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExtractionFieldCandidate" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "resultId" UUID NOT NULL,
  "fieldKey" VARCHAR(100) NOT NULL,
  "rawValue" TEXT NOT NULL,
  "normalizedValueJson" JSONB NOT NULL,
  "confidence" DECIMAL(5,4) NOT NULL,
  "sourcePage" INTEGER,
  "sourceText" TEXT,
  "status" "ExtractionFieldStatus" NOT NULL DEFAULT 'PROPOSED',
  "reviewedByUserId" UUID,
  "reviewedAt" TIMESTAMP(3),
  CONSTRAINT "ExtractionFieldCandidate_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ExtractionFieldCandidate_confidence_check" CHECK ("confidence" >= 0 AND "confidence" <= 1)
);

CREATE UNIQUE INDEX "DocumentFolder_householdId_parentId_normalizedName_key"
  ON "DocumentFolder"("householdId", "parentId", "normalizedName");
CREATE UNIQUE INDEX "DocumentFolder_root_normalizedName_key"
  ON "DocumentFolder"("householdId", "normalizedName") WHERE "parentId" IS NULL;
CREATE INDEX "DocumentFolder_householdId_parentId_name_idx"
  ON "DocumentFolder"("householdId", "parentId", "name");
CREATE INDEX "DocumentFolder_createdByUserId_idx" ON "DocumentFolder"("createdByUserId");
CREATE INDEX "Document_householdId_folderId_status_idx" ON "Document"("householdId", "folderId", "status");
CREATE INDEX "Document_householdId_type_idx" ON "Document"("householdId", "type");
CREATE INDEX "Document_householdId_documentDate_idx" ON "Document"("householdId", "documentDate");
CREATE INDEX "ExtractionJob_householdId_documentId_createdAt_idx"
  ON "ExtractionJob"("householdId", "documentId", "createdAt");
CREATE INDEX "ExtractionJob_status_createdAt_idx" ON "ExtractionJob"("status", "createdAt");
CREATE INDEX "ExtractionJob_requestedByUserId_idx" ON "ExtractionJob"("requestedByUserId");
CREATE UNIQUE INDEX "ExtractionResult_jobId_key" ON "ExtractionResult"("jobId");
CREATE UNIQUE INDEX "ExtractionFieldCandidate_resultId_fieldKey_key"
  ON "ExtractionFieldCandidate"("resultId", "fieldKey");
CREATE INDEX "ExtractionFieldCandidate_resultId_status_idx"
  ON "ExtractionFieldCandidate"("resultId", "status");
CREATE INDEX "ExtractionFieldCandidate_reviewedByUserId_idx"
  ON "ExtractionFieldCandidate"("reviewedByUserId");

ALTER TABLE "DocumentFolder" ADD CONSTRAINT "DocumentFolder_householdId_fkey"
  FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DocumentFolder" ADD CONSTRAINT "DocumentFolder_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "DocumentFolder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DocumentFolder" ADD CONSTRAINT "DocumentFolder_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_folderId_fkey"
  FOREIGN KEY ("folderId") REFERENCES "DocumentFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExtractionJob" ADD CONSTRAINT "ExtractionJob_householdId_fkey"
  FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExtractionJob" ADD CONSTRAINT "ExtractionJob_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExtractionJob" ADD CONSTRAINT "ExtractionJob_documentFileId_fkey"
  FOREIGN KEY ("documentFileId") REFERENCES "DocumentFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExtractionJob" ADD CONSTRAINT "ExtractionJob_requestedByUserId_fkey"
  FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExtractionResult" ADD CONSTRAINT "ExtractionResult_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "ExtractionJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExtractionFieldCandidate" ADD CONSTRAINT "ExtractionFieldCandidate_resultId_fkey"
  FOREIGN KEY ("resultId") REFERENCES "ExtractionResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExtractionFieldCandidate" ADD CONSTRAINT "ExtractionFieldCandidate_reviewedByUserId_fkey"
  FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
