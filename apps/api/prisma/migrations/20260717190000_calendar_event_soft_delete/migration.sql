ALTER TABLE "CalendarEvent"
ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "deletedByUserId" UUID;

ALTER TABLE "CalendarEvent"
ADD CONSTRAINT "CalendarEvent_deletedByUserId_fkey"
FOREIGN KEY ("deletedByUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "CalendarEvent_householdId_deletedAt_startsAt_endsAt_idx"
ON "CalendarEvent"("householdId", "deletedAt", "startsAt", "endsAt");

CREATE INDEX "CalendarEvent_deletedByUserId_idx"
ON "CalendarEvent"("deletedByUserId");
