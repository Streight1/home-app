ALTER TYPE "CalendarEventSource" ADD VALUE IF NOT EXISTS 'TASK';

ALTER TABLE "AgendaTask"
  ADD COLUMN "estimatedDurationMinutes" INTEGER,
  ADD COLUMN "locationPlaceId" UUID,
  ADD COLUMN "locationLabel" VARCHAR(300),
  ADD COLUMN "locationNotes" VARCHAR(1000);

ALTER TABLE "AgendaTask"
  ADD CONSTRAINT "AgendaTask_estimatedDurationMinutes_check"
  CHECK (
    "estimatedDurationMinutes" IS NULL
    OR "estimatedDurationMinutes" BETWEEN 5 AND 1440
  );

ALTER TABLE "AgendaTask"
  ADD CONSTRAINT "AgendaTask_locationPlaceId_fkey"
  FOREIGN KEY ("locationPlaceId") REFERENCES "SavedPlace"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "AgendaTask_locationPlaceId_idx"
  ON "AgendaTask"("locationPlaceId");

CREATE TABLE "TaskParticipant" (
  "taskId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "addedByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TaskParticipant_pkey" PRIMARY KEY ("taskId", "userId"),
  CONSTRAINT "TaskParticipant_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "AgendaTask"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TaskParticipant_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "TaskParticipant_addedByUserId_fkey"
    FOREIGN KEY ("addedByUserId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "TaskParticipant_userId_taskId_idx"
  ON "TaskParticipant"("userId", "taskId");
CREATE INDEX "TaskParticipant_addedByUserId_idx"
  ON "TaskParticipant"("addedByUserId");

INSERT INTO "TaskParticipant" ("taskId", "userId", "addedByUserId")
SELECT "id", "assignedToUserId", "createdByUserId"
FROM "AgendaTask"
WHERE "assignedToUserId" IS NOT NULL
ON CONFLICT ("taskId", "userId") DO NOTHING;

CREATE TABLE "TaskCalendarLink" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "householdId" UUID NOT NULL,
  "taskId" UUID NOT NULL,
  "calendarEventId" UUID NOT NULL,
  "occurrenceDueAt" TIMESTAMP(3),
  "createdByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "removedAt" TIMESTAMP(3),
  CONSTRAINT "TaskCalendarLink_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TaskCalendarLink_householdId_fkey"
    FOREIGN KEY ("householdId") REFERENCES "Household"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "TaskCalendarLink_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "AgendaTask"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "TaskCalendarLink_calendarEventId_fkey"
    FOREIGN KEY ("calendarEventId") REFERENCES "CalendarEvent"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "TaskCalendarLink_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "TaskCalendarLink_taskId_calendarEventId_key"
    UNIQUE ("taskId", "calendarEventId")
);

CREATE INDEX "TaskCalendarLink_householdId_taskId_removedAt_idx"
  ON "TaskCalendarLink"("householdId", "taskId", "removedAt");
CREATE INDEX "TaskCalendarLink_calendarEventId_removedAt_idx"
  ON "TaskCalendarLink"("calendarEventId", "removedAt");
CREATE INDEX "TaskCalendarLink_createdByUserId_idx"
  ON "TaskCalendarLink"("createdByUserId");
