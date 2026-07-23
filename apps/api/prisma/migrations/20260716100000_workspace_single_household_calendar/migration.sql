-- Single-household bootstrap is an explicit stable pointer. Existing households
-- are intentionally not modified; the owner login adopts a safe existing
-- household or creates the pointer transactionally.
CREATE TABLE "SingleHouseholdBootstrap" (
    "id" VARCHAR(32) NOT NULL DEFAULT 'primary',
    "householdId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SingleHouseholdBootstrap_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SingleHouseholdBootstrap_householdId_key"
    ON "SingleHouseholdBootstrap"("householdId");

ALTER TABLE "SingleHouseholdBootstrap"
    ADD CONSTRAINT "SingleHouseholdBootstrap_householdId_fkey"
    FOREIGN KEY ("householdId") REFERENCES "Household"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TYPE "CalendarEventType" AS ENUM (
    'GENERAL', 'WORK_SHIFT', 'APPOINTMENT', 'HOUSEHOLD',
    'PERSONAL', 'TRAVEL', 'OTHER'
);

CREATE TYPE "CalendarEventStatus" AS ENUM ('ACTIVE', 'CANCELLED');
CREATE TYPE "CalendarEventSource" AS ENUM ('MANUAL', 'TEMPLATE');
CREATE TYPE "CalendarParticipantRole" AS ENUM ('ASSIGNEE', 'ATTENDEE');

CREATE TABLE "CalendarTemplate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "householdId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "eventType" "CalendarEventType" NOT NULL,
    "startLocalTime" VARCHAR(5) NOT NULL,
    "endLocalTime" VARCHAR(5) NOT NULL,
    "endDayOffset" INTEGER NOT NULL DEFAULT 0,
    "timezone" VARCHAR(100) NOT NULL,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "defaultLocation" VARCHAR(300),
    "colorToken" VARCHAR(30) NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CalendarTemplate_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CalendarTemplate_endDayOffset_check" CHECK ("endDayOffset" BETWEEN 0 AND 7),
    CONSTRAINT "CalendarTemplate_startLocalTime_check" CHECK ("startLocalTime" ~ '^[0-2][0-9]:[0-5][0-9]$'),
    CONSTRAINT "CalendarTemplate_endLocalTime_check" CHECK ("endLocalTime" ~ '^[0-2][0-9]:[0-5][0-9]$'),
    CONSTRAINT "CalendarTemplate_colorToken_check" CHECK ("colorToken" IN ('primary', 'blue', 'cyan', 'success', 'warning', 'danger'))
);

CREATE TABLE "CalendarTemplateApplicationBatch" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "householdId" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "eventCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revertedAt" TIMESTAMP(3),
    CONSTRAINT "CalendarTemplateApplicationBatch_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CalendarTemplateApplicationBatch_eventCount_check" CHECK ("eventCount" >= 1)
);

CREATE TABLE "CalendarEvent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "householdId" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "type" "CalendarEventType" NOT NULL DEFAULT 'GENERAL',
    "status" "CalendarEventStatus" NOT NULL DEFAULT 'ACTIVE',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "timezone" VARCHAR(100) NOT NULL,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "location" VARCHAR(300),
    "colorToken" VARCHAR(30) NOT NULL,
    "source" "CalendarEventSource" NOT NULL DEFAULT 'MANUAL',
    "templateId" UUID,
    "templateApplicationBatchId" UUID,
    "createdByUserId" UUID NOT NULL,
    "updatedByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CalendarEvent_time_range_check" CHECK ("endsAt" > "startsAt"),
    CONSTRAINT "CalendarEvent_colorToken_check" CHECK ("colorToken" IN ('primary', 'blue', 'cyan', 'success', 'warning', 'danger'))
);

CREATE TABLE "CalendarEventParticipant" (
    "eventId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "CalendarParticipantRole" NOT NULL DEFAULT 'ATTENDEE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CalendarEventParticipant_pkey" PRIMARY KEY ("eventId", "userId")
);

CREATE TABLE "CalendarTemplateParticipant" (
    "templateId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "CalendarParticipantRole" NOT NULL DEFAULT 'ASSIGNEE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CalendarTemplateParticipant_pkey" PRIMARY KEY ("templateId", "userId")
);

CREATE UNIQUE INDEX "CalendarTemplate_householdId_name_key" ON "CalendarTemplate"("householdId", "name");
CREATE INDEX "CalendarTemplate_householdId_eventType_name_idx" ON "CalendarTemplate"("householdId", "eventType", "name");
CREATE INDEX "CalendarTemplate_createdByUserId_idx" ON "CalendarTemplate"("createdByUserId");
CREATE INDEX "CalendarTemplateApplicationBatch_householdId_createdAt_idx" ON "CalendarTemplateApplicationBatch"("householdId", "createdAt");
CREATE INDEX "CalendarTemplateApplicationBatch_templateId_createdAt_idx" ON "CalendarTemplateApplicationBatch"("templateId", "createdAt");
CREATE INDEX "CalendarTemplateApplicationBatch_createdByUserId_idx" ON "CalendarTemplateApplicationBatch"("createdByUserId");
CREATE INDEX "CalendarEvent_householdId_status_startsAt_endsAt_idx" ON "CalendarEvent"("householdId", "status", "startsAt", "endsAt");
CREATE INDEX "CalendarEvent_householdId_type_startsAt_idx" ON "CalendarEvent"("householdId", "type", "startsAt");
CREATE INDEX "CalendarEvent_templateId_idx" ON "CalendarEvent"("templateId");
CREATE INDEX "CalendarEvent_templateApplicationBatchId_idx" ON "CalendarEvent"("templateApplicationBatchId");
CREATE INDEX "CalendarEvent_createdByUserId_idx" ON "CalendarEvent"("createdByUserId");
CREATE INDEX "CalendarEvent_updatedByUserId_idx" ON "CalendarEvent"("updatedByUserId");
CREATE INDEX "CalendarEventParticipant_userId_eventId_idx" ON "CalendarEventParticipant"("userId", "eventId");
CREATE INDEX "CalendarTemplateParticipant_userId_templateId_idx" ON "CalendarTemplateParticipant"("userId", "templateId");

ALTER TABLE "CalendarTemplate" ADD CONSTRAINT "CalendarTemplate_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CalendarTemplate" ADD CONSTRAINT "CalendarTemplate_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CalendarTemplateApplicationBatch" ADD CONSTRAINT "CalendarTemplateApplicationBatch_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CalendarTemplateApplicationBatch" ADD CONSTRAINT "CalendarTemplateApplicationBatch_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CalendarTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CalendarTemplateApplicationBatch" ADD CONSTRAINT "CalendarTemplateApplicationBatch_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CalendarTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_templateApplicationBatchId_fkey" FOREIGN KEY ("templateApplicationBatchId") REFERENCES "CalendarTemplateApplicationBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CalendarEventParticipant" ADD CONSTRAINT "CalendarEventParticipant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarEventParticipant" ADD CONSTRAINT "CalendarEventParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CalendarTemplateParticipant" ADD CONSTRAINT "CalendarTemplateParticipant_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CalendarTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarTemplateParticipant" ADD CONSTRAINT "CalendarTemplateParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
