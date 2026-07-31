-- Keep lease ownership compatible with an older API worker during a rolling
-- deployment. The old binary updates only status/attempts; the trigger fills
-- the newly introduced lease timestamp at the database boundary.
CREATE FUNCTION "set_stored_file_deletion_processing_started_at"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."status" = 'PROCESSING'
    AND NEW."processingStartedAt" IS NULL THEN
    NEW."processingStartedAt" = CURRENT_TIMESTAMP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "StoredFileDeletionTask_processing_lease_trigger"
BEFORE INSERT OR UPDATE OF "status" ON "StoredFileDeletionTask"
FOR EACH ROW
EXECUTE FUNCTION "set_stored_file_deletion_processing_started_at"();

-- The trigger is installed before this backfill, so a concurrent old worker
-- cannot create another PROCESSING row with a null lease after the update.
UPDATE "StoredFileDeletionTask"
SET "processingStartedAt" = CURRENT_TIMESTAMP
WHERE "status" = 'PROCESSING'
  AND "processingStartedAt" IS NULL;
