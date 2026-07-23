ALTER TABLE "AgendaTask"
  ADD COLUMN "dueDate" DATE,
  ADD COLUMN "dueTimeMinutes" INTEGER;

UPDATE "AgendaTask"
SET
  "dueDate" = (
    "dueAt" AT TIME ZONE 'UTC' AT TIME ZONE "timezone"
  )::date,
  "dueTimeMinutes" = CASE
    WHEN "isAllDay" THEN NULL
    ELSE (
      EXTRACT(HOUR FROM ("dueAt" AT TIME ZONE 'UTC' AT TIME ZONE "timezone"))::integer * 60
      + EXTRACT(MINUTE FROM ("dueAt" AT TIME ZONE 'UTC' AT TIME ZONE "timezone"))::integer
    )
  END
WHERE "dueAt" IS NOT NULL;

UPDATE "AgendaTask"
SET "dueAt" = NULL
WHERE "isAllDay" = TRUE;

ALTER TABLE "AgendaTask"
  ADD CONSTRAINT "AgendaTask_dueTimeMinutes_check"
    CHECK (
      "dueTimeMinutes" IS NULL
      OR "dueTimeMinutes" BETWEEN 0 AND 1439
    ),
  ADD CONSTRAINT "AgendaTask_dueDate_time_consistency_check"
    CHECK (
      ("dueDate" IS NULL AND "dueTimeMinutes" IS NULL AND "dueAt" IS NULL)
      OR ("dueDate" IS NOT NULL AND "dueTimeMinutes" IS NULL AND "dueAt" IS NULL)
      OR ("dueDate" IS NOT NULL AND "dueTimeMinutes" IS NOT NULL AND "dueAt" IS NOT NULL)
    );

CREATE INDEX "AgendaTask_householdId_status_dueDate_idx"
  ON "AgendaTask"("householdId", "status", "dueDate");

ALTER TABLE "TaskCompletion"
  ADD COLUMN "occurrenceDueDate" DATE,
  ADD COLUMN "occurrenceDueTimeMinutes" INTEGER;

UPDATE "TaskCompletion" completion
SET
  "occurrenceDueDate" = (
    completion."occurrenceDueAt" AT TIME ZONE 'UTC' AT TIME ZONE task."timezone"
  )::date,
  "occurrenceDueTimeMinutes" = (
    EXTRACT(HOUR FROM (
      completion."occurrenceDueAt" AT TIME ZONE 'UTC' AT TIME ZONE task."timezone"
    ))::integer * 60
    + EXTRACT(MINUTE FROM (
      completion."occurrenceDueAt" AT TIME ZONE 'UTC' AT TIME ZONE task."timezone"
    ))::integer
  )
FROM "AgendaTask" task
WHERE completion."taskId" = task."id"
  AND completion."occurrenceDueAt" IS NOT NULL;

ALTER TABLE "TaskCompletion"
  ADD CONSTRAINT "TaskCompletion_occurrenceDueTimeMinutes_check"
    CHECK (
      "occurrenceDueTimeMinutes" IS NULL
      OR "occurrenceDueTimeMinutes" BETWEEN 0 AND 1439
    );
