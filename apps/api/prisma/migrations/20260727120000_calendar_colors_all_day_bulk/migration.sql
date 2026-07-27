-- Canonicalize legacy event/template colors before the application switches
-- to the Aurora calendar palette. Unknown values become automatic.
ALTER TABLE "CalendarEvent"
  DROP CONSTRAINT "CalendarEvent_colorToken_check";

ALTER TABLE "CalendarTemplate"
  DROP CONSTRAINT "CalendarTemplate_colorToken_check";

UPDATE "CalendarEvent"
SET "colorToken" = CASE "colorToken"
  WHEN 'primary' THEN 'violet'
  WHEN 'success' THEN 'green'
  WHEN 'warning' THEN 'amber'
  WHEN 'danger' THEN 'rose'
  WHEN 'blue' THEN 'blue'
  WHEN 'cyan' THEN 'cyan'
  WHEN 'violet' THEN 'violet'
  WHEN 'green' THEN 'green'
  WHEN 'amber' THEN 'amber'
  WHEN 'orange' THEN 'orange'
  WHEN 'rose' THEN 'rose'
  WHEN 'pink' THEN 'pink'
  ELSE NULL
END;

UPDATE "CalendarTemplate"
SET "colorToken" = CASE "colorToken"
  WHEN 'primary' THEN 'violet'
  WHEN 'success' THEN 'green'
  WHEN 'warning' THEN 'amber'
  WHEN 'danger' THEN 'rose'
  ELSE "colorToken"
END;

ALTER TABLE "CalendarEvent"
  ADD CONSTRAINT "CalendarEvent_colorToken_check"
  CHECK (
    "colorToken" IS NULL
    OR "colorToken" IN (
      'violet', 'blue', 'cyan', 'green', 'amber', 'orange', 'rose', 'pink'
    )
  );

ALTER TABLE "CalendarTemplate"
  ADD CONSTRAINT "CalendarTemplate_colorToken_check"
  CHECK (
    "colorToken" IN (
      'violet', 'blue', 'cyan', 'green', 'amber', 'orange', 'rose', 'pink'
    )
  );

ALTER TABLE "CalendarEvent"
  ADD COLUMN "allDayStartDate" DATE,
  ADD COLUMN "allDayEndDateExclusive" DATE,
  ADD COLUMN "desiredArrivalAt" TIMESTAMP(3);

UPDATE "CalendarEvent"
SET
  "allDayStartDate" = ("startsAt" AT TIME ZONE "timezone")::date,
  "allDayEndDateExclusive" = ("endsAt" AT TIME ZONE "timezone")::date
WHERE "isAllDay" = true;

UPDATE "CalendarEvent"
SET "allDayEndDateExclusive" = "allDayStartDate" + 1
WHERE "isAllDay" = true
  AND "allDayEndDateExclusive" <= "allDayStartDate";

UPDATE "CalendarEvent"
SET "startsAt" = NULL, "endsAt" = NULL
WHERE "isAllDay" = true;

ALTER TABLE "CalendarEvent"
  ALTER COLUMN "startsAt" DROP NOT NULL,
  ALTER COLUMN "endsAt" DROP NOT NULL,
  ALTER COLUMN "colorToken" DROP NOT NULL;

ALTER TABLE "CalendarEvent"
  ADD CONSTRAINT "CalendarEvent_schedule_shape_check"
  CHECK (
    (
      "isAllDay" = false
      AND "startsAt" IS NOT NULL
      AND "endsAt" IS NOT NULL
      AND "endsAt" > "startsAt"
      AND "allDayStartDate" IS NULL
      AND "allDayEndDateExclusive" IS NULL
      AND "desiredArrivalAt" IS NULL
    )
    OR
    (
      "isAllDay" = true
      AND "startsAt" IS NULL
      AND "endsAt" IS NULL
      AND "allDayStartDate" IS NOT NULL
      AND "allDayEndDateExclusive" IS NOT NULL
      AND "allDayEndDateExclusive" > "allDayStartDate"
    )
  );

ALTER TABLE "CalendarUserPreference"
  ADD COLUMN "showTravelBlocksInMonth" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "CalendarEvent_householdId_status_allDayStartDate_allDayEndDateExclusive_idx"
  ON "CalendarEvent"(
    "householdId",
    "status",
    "allDayStartDate",
    "allDayEndDateExclusive"
  );
