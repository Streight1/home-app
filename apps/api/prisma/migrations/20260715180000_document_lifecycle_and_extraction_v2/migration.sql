-- Preserve existing document and extraction data while extending lifecycle state.
ALTER TYPE "DocumentStatus" ADD VALUE IF NOT EXISTS 'TRASHED';

CREATE TYPE "StoredFileDeletionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

ALTER TABLE "Document"
  ADD COLUMN "trashedAt" TIMESTAMP(3),
  ADD COLUMN "trashedByUserId" UUID,
  ADD COLUMN "trashedFromFolderId" UUID;

ALTER TABLE "ExtractionFieldCandidate"
  ADD COLUMN "confidenceReasonsJson" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "sourceRegionJson" JSONB;

CREATE TABLE "StoredFileDeletionTask" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "storageKey" VARCHAR(500) NOT NULL,
  "status" "StoredFileDeletionStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastErrorCode" VARCHAR(100),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "StoredFileDeletionTask_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Document"
  ADD CONSTRAINT "Document_trashedByUserId_fkey"
  FOREIGN KEY ("trashedByUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Document_trashedFromFolderId_fkey"
  FOREIGN KEY ("trashedFromFolderId") REFERENCES "DocumentFolder"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Document_householdId_status_trashedAt_idx"
  ON "Document"("householdId", "status", "trashedAt");
CREATE INDEX "Document_trashedByUserId_idx" ON "Document"("trashedByUserId");
CREATE INDEX "Document_trashedFromFolderId_idx" ON "Document"("trashedFromFolderId");
CREATE INDEX "StoredFileDeletionTask_status_createdAt_idx"
  ON "StoredFileDeletionTask"("status", "createdAt");
