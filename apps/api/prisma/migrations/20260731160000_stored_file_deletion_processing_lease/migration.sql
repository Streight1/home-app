-- Allow a later worker to reclaim deletion tasks left in PROCESSING after a crash.
ALTER TABLE "StoredFileDeletionTask"
  ADD COLUMN "processingStartedAt" TIMESTAMP(3);

-- Existing PROCESSING rows receive a conservative fresh lease instead of being
-- reclaimed immediately while a worker from the previous deployment may finish.
UPDATE "StoredFileDeletionTask"
SET "processingStartedAt" = CURRENT_TIMESTAMP
WHERE "status" = 'PROCESSING'
  AND "processingStartedAt" IS NULL;

CREATE INDEX "StoredFileDeletionTask_lease_idx"
  ON "StoredFileDeletionTask"("status", "processingStartedAt", "createdAt");
