CREATE TYPE "SavedPlaceVisibility" AS ENUM ('PRIVATE', 'HOUSEHOLD');
CREATE TYPE "PlaceProvider" AS ENUM ('MAPY', 'MANUAL');
CREATE TYPE "CalendarRouteMode" AS ENUM ('CAR_FAST_TRAFFIC', 'CAR_FAST', 'CAR_SHORT', 'FOOT_FAST', 'BICYCLE_ROAD', 'BICYCLE_MOUNTAIN');
CREATE TYPE "CalendarViewPreference" AS ENUM ('MONTH', 'WEEK', 'DAY', 'AGENDA');
CREATE TYPE "TravelOriginMode" AS ENUM ('DEFAULT_PLACE', 'PREVIOUS_EVENT', 'CUSTOM_PLACE');
CREATE TYPE "TravelPlanStatus" AS ENUM ('NOT_CALCULATED', 'CALCULATING', 'READY', 'STALE', 'FAILED', 'UNAVAILABLE');
CREATE TYPE "TravelProvider" AS ENUM ('MAPY');

CREATE TABLE "SavedPlace" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "householdId" UUID NOT NULL,
    "ownerUserId" UUID,
    "visibility" "SavedPlaceVisibility" NOT NULL DEFAULT 'PRIVATE',
    "label" VARCHAR(120) NOT NULL,
    "formattedAddress" VARCHAR(300) NOT NULL,
    "provider" "PlaceProvider" NOT NULL,
    "providerPlaceId" VARCHAR(200),
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "placeType" VARCHAR(80) NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SavedPlace_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SavedPlace_coordinates_check" CHECK (("latitude" IS NULL AND "longitude" IS NULL) OR ("latitude" BETWEEN -90 AND 90 AND "longitude" BETWEEN -180 AND 180))
);

CREATE TABLE "CalendarUserPreference" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "householdId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "defaultPlaceId" UUID,
    "defaultRouteMode" "CalendarRouteMode" NOT NULL DEFAULT 'CAR_FAST_TRAFFIC',
    "defaultTravelBufferMinutes" INTEGER NOT NULL DEFAULT 10,
    "avoidTolls" BOOLEAN NOT NULL DEFAULT false,
    "avoidHighways" BOOLEAN NOT NULL DEFAULT false,
    "compactCalendarView" "CalendarViewPreference" NOT NULL DEFAULT 'AGENDA',
    "mediumCalendarView" "CalendarViewPreference" NOT NULL DEFAULT 'MONTH',
    "expandedCalendarView" "CalendarViewPreference" NOT NULL DEFAULT 'MONTH',
    "showTravelBlocks" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CalendarUserPreference_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CalendarUserPreference_buffer_check" CHECK ("defaultTravelBufferMinutes" BETWEEN 0 AND 240)
);

ALTER TABLE "CalendarEvent"
    ADD COLUMN "locationPlaceId" UUID,
    ADD COLUMN "locationLabel" VARCHAR(300),
    ADD COLUMN "locationNotes" VARCHAR(1000);

UPDATE "CalendarEvent" SET "locationLabel" = "location" WHERE "location" IS NOT NULL;

CREATE TABLE "CalendarEventTravelPlan" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "householdId" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "travelerUserId" UUID NOT NULL,
    "originMode" "TravelOriginMode" NOT NULL,
    "originPlaceId" UUID,
    "previousEventId" UUID,
    "destinationPlaceId" UUID NOT NULL,
    "routeMode" "CalendarRouteMode" NOT NULL,
    "avoidTolls" BOOLEAN NOT NULL DEFAULT false,
    "avoidHighways" BOOLEAN NOT NULL DEFAULT false,
    "travelBufferMinutes" INTEGER NOT NULL DEFAULT 10,
    "distanceMeters" INTEGER,
    "durationSeconds" INTEGER,
    "departureAt" TIMESTAMP(3),
    "status" "TravelPlanStatus" NOT NULL DEFAULT 'NOT_CALCULATED',
    "provider" "TravelProvider" NOT NULL DEFAULT 'MAPY',
    "providerCalculatedAt" TIMESTAMP(3),
    "inputHash" CHAR(64) NOT NULL,
    "lastErrorCode" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CalendarEventTravelPlan_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CalendarEventTravelPlan_buffer_check" CHECK ("travelBufferMinutes" BETWEEN 0 AND 240),
    CONSTRAINT "CalendarEventTravelPlan_metrics_check" CHECK (("distanceMeters" IS NULL OR "distanceMeters" >= 0) AND ("durationSeconds" IS NULL OR "durationSeconds" >= 0)),
    CONSTRAINT "CalendarEventTravelPlan_origin_check" CHECK (
      ("originMode" = 'DEFAULT_PLACE' AND "originPlaceId" IS NULL AND "previousEventId" IS NULL) OR
      ("originMode" = 'CUSTOM_PLACE' AND "originPlaceId" IS NOT NULL AND "previousEventId" IS NULL) OR
      ("originMode" = 'PREVIOUS_EVENT' AND "originPlaceId" IS NULL AND "previousEventId" IS NOT NULL)
    )
);

CREATE INDEX "SavedPlace_householdId_visibility_label_idx" ON "SavedPlace"("householdId", "visibility", "label");
CREATE INDEX "SavedPlace_ownerUserId_label_idx" ON "SavedPlace"("ownerUserId", "label");
CREATE INDEX "SavedPlace_createdByUserId_idx" ON "SavedPlace"("createdByUserId");
CREATE UNIQUE INDEX "CalendarUserPreference_householdId_userId_key" ON "CalendarUserPreference"("householdId", "userId");
CREATE INDEX "CalendarUserPreference_userId_idx" ON "CalendarUserPreference"("userId");
CREATE INDEX "CalendarUserPreference_defaultPlaceId_idx" ON "CalendarUserPreference"("defaultPlaceId");
CREATE INDEX "CalendarEvent_locationPlaceId_idx" ON "CalendarEvent"("locationPlaceId");
CREATE UNIQUE INDEX "CalendarEventTravelPlan_eventId_travelerUserId_key" ON "CalendarEventTravelPlan"("eventId", "travelerUserId");
CREATE INDEX "CalendarEventTravelPlan_householdId_travelerUserId_status_idx" ON "CalendarEventTravelPlan"("householdId", "travelerUserId", "status");
CREATE INDEX "CalendarEventTravelPlan_previousEventId_idx" ON "CalendarEventTravelPlan"("previousEventId");
CREATE INDEX "CalendarEventTravelPlan_originPlaceId_idx" ON "CalendarEventTravelPlan"("originPlaceId");
CREATE INDEX "CalendarEventTravelPlan_destinationPlaceId_idx" ON "CalendarEventTravelPlan"("destinationPlaceId");

ALTER TABLE "SavedPlace" ADD CONSTRAINT "SavedPlace_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SavedPlace" ADD CONSTRAINT "SavedPlace_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedPlace" ADD CONSTRAINT "SavedPlace_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CalendarUserPreference" ADD CONSTRAINT "CalendarUserPreference_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CalendarUserPreference" ADD CONSTRAINT "CalendarUserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarUserPreference" ADD CONSTRAINT "CalendarUserPreference_defaultPlaceId_fkey" FOREIGN KEY ("defaultPlaceId") REFERENCES "SavedPlace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_locationPlaceId_fkey" FOREIGN KEY ("locationPlaceId") REFERENCES "SavedPlace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CalendarEventTravelPlan" ADD CONSTRAINT "CalendarEventTravelPlan_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CalendarEventTravelPlan" ADD CONSTRAINT "CalendarEventTravelPlan_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarEventTravelPlan" ADD CONSTRAINT "CalendarEventTravelPlan_travelerUserId_fkey" FOREIGN KEY ("travelerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CalendarEventTravelPlan" ADD CONSTRAINT "CalendarEventTravelPlan_originPlaceId_fkey" FOREIGN KEY ("originPlaceId") REFERENCES "SavedPlace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CalendarEventTravelPlan" ADD CONSTRAINT "CalendarEventTravelPlan_previousEventId_fkey" FOREIGN KEY ("previousEventId") REFERENCES "CalendarEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CalendarEventTravelPlan" ADD CONSTRAINT "CalendarEventTravelPlan_destinationPlaceId_fkey" FOREIGN KEY ("destinationPlaceId") REFERENCES "SavedPlace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
