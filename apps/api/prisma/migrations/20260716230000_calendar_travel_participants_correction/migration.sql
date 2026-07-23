ALTER TYPE "TravelOriginMode" ADD VALUE IF NOT EXISTS 'AUTO' BEFORE 'DEFAULT_PLACE';

ALTER TABLE "HouseholdMember"
  ADD COLUMN "calendarColorToken" VARCHAR(20) NOT NULL DEFAULT 'violet';

WITH ranked AS (
  SELECT "id", row_number() OVER (
    PARTITION BY "householdId" ORDER BY "createdAt", "id"
  ) AS position
  FROM "HouseholdMember"
)
UPDATE "HouseholdMember" AS member
SET "calendarColorToken" = CASE ((ranked.position - 1) % 8)
  WHEN 0 THEN 'violet'
  WHEN 1 THEN 'rose'
  WHEN 2 THEN 'blue'
  WHEN 3 THEN 'cyan'
  WHEN 4 THEN 'green'
  WHEN 5 THEN 'amber'
  WHEN 6 THEN 'orange'
  ELSE 'pink'
END
FROM ranked
WHERE ranked."id" = member."id";

ALTER TABLE "HouseholdMember"
  ADD CONSTRAINT "HouseholdMember_calendar_color_check"
  CHECK ("calendarColorToken" IN ('violet', 'blue', 'cyan', 'green', 'amber', 'orange', 'rose', 'pink'));

ALTER TABLE "CalendarEvent"
  ADD COLUMN "calculateTravel" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "CalendarTemplate"
  ADD COLUMN "locationPlaceId" UUID,
  ADD COLUMN "locationLabel" VARCHAR(300),
  ADD COLUMN "calculateTravel" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "routeMode" "CalendarRouteMode" NOT NULL DEFAULT 'CAR_FAST_TRAFFIC',
  ADD COLUMN "travelBufferMinutes" INTEGER NOT NULL DEFAULT 10;

UPDATE "CalendarTemplate"
SET "locationLabel" = "defaultLocation"
WHERE "defaultLocation" IS NOT NULL;

ALTER TABLE "CalendarTemplate"
  ADD CONSTRAINT "CalendarTemplate_travel_buffer_check"
  CHECK ("travelBufferMinutes" BETWEEN 0 AND 240),
  ADD CONSTRAINT "CalendarTemplate_locationPlaceId_fkey"
  FOREIGN KEY ("locationPlaceId") REFERENCES "SavedPlace"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "CalendarTemplate_locationPlaceId_idx"
  ON "CalendarTemplate"("locationPlaceId");

ALTER TABLE "CalendarUserPreference"
  ADD COLUMN "lastWorkShiftParticipantUserId" UUID;

ALTER TABLE "CalendarUserPreference"
  ADD CONSTRAINT "CalendarUserPreference_lastWorkShiftParticipantUserId_fkey"
  FOREIGN KEY ("lastWorkShiftParticipantUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "CalendarUserPreference_lastWorkShiftParticipantUserId_idx"
  ON "CalendarUserPreference"("lastWorkShiftParticipantUserId");

-- Mapy.com API responses are not a persistent cache. Keep the legacy nullable
-- columns for a non-destructive rollout, but erase derived provider output and
-- stop exposing them through Prisma. A later maintenance migration may drop
-- these compatibility columns after all deployments run the corrected code.
UPDATE "SavedPlace"
SET "providerPlaceId" = NULL, "latitude" = NULL, "longitude" = NULL
WHERE "provider" = 'MAPY';

ALTER TABLE "CalendarEventTravelPlan"
  ALTER COLUMN "inputHash" DROP NOT NULL;

UPDATE "CalendarEventTravelPlan"
SET "distanceMeters" = NULL,
    "durationSeconds" = NULL,
    "departureAt" = NULL,
    "providerCalculatedAt" = NULL,
    "inputHash" = NULL,
    "lastErrorCode" = NULL,
    "status" = 'STALE';

ALTER TABLE "CalendarEventTravelPlan"
  DROP CONSTRAINT "CalendarEventTravelPlan_origin_check";

ALTER TABLE "CalendarEventTravelPlan"
  ADD CONSTRAINT "CalendarEventTravelPlan_origin_check" CHECK (
    ("originMode" = 'AUTO' AND "originPlaceId" IS NULL AND "previousEventId" IS NULL) OR
    ("originMode" = 'DEFAULT_PLACE' AND "originPlaceId" IS NULL AND "previousEventId" IS NULL) OR
    ("originMode" = 'CUSTOM_PLACE' AND "originPlaceId" IS NOT NULL AND "previousEventId" IS NULL) OR
    ("originMode" = 'PREVIOUS_EVENT' AND "originPlaceId" IS NULL AND "previousEventId" IS NOT NULL)
  );
