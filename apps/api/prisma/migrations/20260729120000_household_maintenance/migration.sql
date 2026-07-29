CREATE TYPE "MaintenancePlanStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "MaintenanceOccurrenceStatus" AS ENUM ('SCHEDULED', 'TASK_CREATED', 'COMPLETED', 'SKIPPED', 'CANCELLED');
CREATE TYPE "MaintenancePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE "MaintenanceRecurrenceBasis" AS ENUM ('FROM_SCHEDULED_DATE', 'FROM_COMPLETION_DATE');
CREATE TYPE "MaintenanceDocumentRelationType" AS ENUM ('SERVICE_REPORT', 'INVOICE', 'RECEIPT', 'WARRANTY', 'MANUAL', 'PHOTO', 'OTHER');
CREATE TYPE "MaintenanceTransactionRelationType" AS ENUM ('SERVICE_COST', 'MATERIAL', 'INSPECTION_FEE', 'OTHER');

CREATE TABLE "MaintenanceCategory" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "householdId" UUID NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "normalizedName" VARCHAR(100) NOT NULL,
  "iconKey" VARCHAR(40) NOT NULL,
  "colorToken" VARCHAR(30) NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdByUserId" UUID NOT NULL,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MaintenanceCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MaintenancePlan" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "householdId" UUID NOT NULL,
  "categoryId" UUID,
  "title" VARCHAR(200) NOT NULL,
  "description" VARCHAR(5000),
  "instructions" VARCHAR(10000),
  "priority" "MaintenancePriority" NOT NULL DEFAULT 'NORMAL',
  "status" "MaintenancePlanStatus" NOT NULL DEFAULT 'ACTIVE',
  "recurrenceDefinition" JSONB NOT NULL,
  "recurrenceBasis" "MaintenanceRecurrenceBasis" NOT NULL DEFAULT 'FROM_SCHEDULED_DATE',
  "startsOn" DATE NOT NULL,
  "endsOn" DATE,
  "nextDueOn" DATE,
  "leadDays" INTEGER NOT NULL DEFAULT 7,
  "estimatedDurationMinutes" INTEGER,
  "preferredStartTime" INTEGER,
  "responsibleUserId" UUID,
  "locationLabel" VARCHAR(300),
  "providerName" VARCHAR(200),
  "defaultCostMinor" BIGINT,
  "defaultCurrencyCode" VARCHAR(3),
  "autoCreateTask" BOOLEAN NOT NULL DEFAULT true,
  "taskCreateDaysBefore" INTEGER NOT NULL DEFAULT 7,
  "createdByUserId" UUID NOT NULL,
  "updatedByUserId" UUID NOT NULL,
  "pausedAt" TIMESTAMP(3),
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MaintenancePlan_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MaintenancePlan_date_range_check" CHECK ("endsOn" IS NULL OR "endsOn" >= "startsOn"),
  CONSTRAINT "MaintenancePlan_lead_days_check" CHECK ("leadDays" BETWEEN 0 AND 365),
  CONSTRAINT "MaintenancePlan_task_lead_days_check" CHECK ("taskCreateDaysBefore" BETWEEN 0 AND 365),
  CONSTRAINT "MaintenancePlan_duration_check" CHECK ("estimatedDurationMinutes" IS NULL OR "estimatedDurationMinutes" BETWEEN 5 AND 1440),
  CONSTRAINT "MaintenancePlan_start_time_check" CHECK ("preferredStartTime" IS NULL OR "preferredStartTime" BETWEEN 0 AND 1439),
  CONSTRAINT "MaintenancePlan_cost_check" CHECK (
    ("defaultCostMinor" IS NULL AND "defaultCurrencyCode" IS NULL)
    OR ("defaultCostMinor" >= 0 AND "defaultCurrencyCode" IS NOT NULL)
  )
);

CREATE TABLE "MaintenanceOccurrence" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "householdId" UUID NOT NULL,
  "maintenancePlanId" UUID NOT NULL,
  "scheduledFor" DATE NOT NULL,
  "originalScheduledFor" DATE NOT NULL,
  "status" "MaintenanceOccurrenceStatus" NOT NULL DEFAULT 'SCHEDULED',
  "taskId" UUID,
  "completedOn" DATE,
  "completedAt" TIMESTAMP(3),
  "completedByUserId" UUID,
  "skippedAt" TIMESTAMP(3),
  "skippedByUserId" UUID,
  "rescheduledAt" TIMESTAMP(3),
  "rescheduledByUserId" UUID,
  "completionNotes" VARCHAR(5000),
  "skipReason" VARCHAR(1000),
  "providerName" VARCHAR(200),
  "actualCostMinor" BIGINT,
  "currencyCode" VARCHAR(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MaintenanceOccurrence_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MaintenanceOccurrence_cost_check" CHECK (
    ("actualCostMinor" IS NULL AND "currencyCode" IS NULL)
    OR ("actualCostMinor" >= 0 AND "currencyCode" IS NOT NULL)
  )
);

CREATE TABLE "MaintenanceTaskLink" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "maintenanceOccurrenceId" UUID NOT NULL,
  "taskId" UUID NOT NULL,
  "createdByUserId" UUID NOT NULL,
  "removedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MaintenanceTaskLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MaintenanceOccurrenceDocument" (
  "maintenanceOccurrenceId" UUID NOT NULL,
  "documentId" UUID NOT NULL,
  "relationType" "MaintenanceDocumentRelationType" NOT NULL,
  "createdByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MaintenanceOccurrenceDocument_pkey" PRIMARY KEY ("maintenanceOccurrenceId", "documentId")
);

CREATE TABLE "MaintenanceOccurrenceTransaction" (
  "maintenanceOccurrenceId" UUID NOT NULL,
  "transactionId" UUID NOT NULL,
  "relationType" "MaintenanceTransactionRelationType" NOT NULL,
  "createdByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MaintenanceOccurrenceTransaction_pkey" PRIMARY KEY ("maintenanceOccurrenceId", "transactionId")
);

CREATE UNIQUE INDEX "MaintenanceCategory_householdId_normalizedName_key" ON "MaintenanceCategory"("householdId", "normalizedName");
CREATE INDEX "MaintenanceCategory_householdId_archivedAt_sortOrder_idx" ON "MaintenanceCategory"("householdId", "archivedAt", "sortOrder");
CREATE INDEX "MaintenanceCategory_createdByUserId_idx" ON "MaintenanceCategory"("createdByUserId");

CREATE INDEX "MaintenancePlan_householdId_archivedAt_idx" ON "MaintenancePlan"("householdId", "archivedAt");
CREATE INDEX "MaintenancePlan_householdId_status_idx" ON "MaintenancePlan"("householdId", "status");
CREATE INDEX "MaintenancePlan_householdId_nextDueOn_idx" ON "MaintenancePlan"("householdId", "nextDueOn");
CREATE INDEX "MaintenancePlan_nextDueOn_idx" ON "MaintenancePlan"("nextDueOn");
CREATE INDEX "MaintenancePlan_categoryId_idx" ON "MaintenancePlan"("categoryId");
CREATE INDEX "MaintenancePlan_responsibleUserId_idx" ON "MaintenancePlan"("responsibleUserId");
CREATE INDEX "MaintenancePlan_createdByUserId_idx" ON "MaintenancePlan"("createdByUserId");
CREATE INDEX "MaintenancePlan_updatedByUserId_idx" ON "MaintenancePlan"("updatedByUserId");

CREATE UNIQUE INDEX "MaintenanceOccurrence_maintenancePlanId_originalScheduledFor_key" ON "MaintenanceOccurrence"("maintenancePlanId", "originalScheduledFor");
CREATE INDEX "MaintenanceOccurrence_maintenancePlanId_scheduledFor_idx" ON "MaintenanceOccurrence"("maintenancePlanId", "scheduledFor");
CREATE INDEX "MaintenanceOccurrence_householdId_status_scheduledFor_idx" ON "MaintenanceOccurrence"("householdId", "status", "scheduledFor");
CREATE INDEX "MaintenanceOccurrence_taskId_idx" ON "MaintenanceOccurrence"("taskId");
CREATE INDEX "MaintenanceOccurrence_completedByUserId_idx" ON "MaintenanceOccurrence"("completedByUserId");
CREATE INDEX "MaintenanceOccurrence_skippedByUserId_idx" ON "MaintenanceOccurrence"("skippedByUserId");
CREATE INDEX "MaintenanceOccurrence_rescheduledByUserId_idx" ON "MaintenanceOccurrence"("rescheduledByUserId");

CREATE INDEX "MaintenanceTaskLink_maintenanceOccurrenceId_removedAt_idx" ON "MaintenanceTaskLink"("maintenanceOccurrenceId", "removedAt");
CREATE INDEX "MaintenanceTaskLink_taskId_removedAt_idx" ON "MaintenanceTaskLink"("taskId", "removedAt");
CREATE INDEX "MaintenanceTaskLink_createdByUserId_idx" ON "MaintenanceTaskLink"("createdByUserId");
CREATE UNIQUE INDEX "MaintenanceTaskLink_active_occurrence_key" ON "MaintenanceTaskLink"("maintenanceOccurrenceId") WHERE "removedAt" IS NULL;
CREATE UNIQUE INDEX "MaintenanceTaskLink_active_task_key" ON "MaintenanceTaskLink"("taskId") WHERE "removedAt" IS NULL;

CREATE INDEX "MaintenanceOccurrenceDocument_documentId_idx" ON "MaintenanceOccurrenceDocument"("documentId");
CREATE INDEX "MaintenanceOccurrenceDocument_createdByUserId_idx" ON "MaintenanceOccurrenceDocument"("createdByUserId");
CREATE INDEX "MaintenanceOccurrenceTransaction_transactionId_idx" ON "MaintenanceOccurrenceTransaction"("transactionId");
CREATE INDEX "MaintenanceOccurrenceTransaction_createdByUserId_idx" ON "MaintenanceOccurrenceTransaction"("createdByUserId");

ALTER TABLE "MaintenanceCategory" ADD CONSTRAINT "MaintenanceCategory_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaintenanceCategory" ADD CONSTRAINT "MaintenanceCategory_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MaintenancePlan" ADD CONSTRAINT "MaintenancePlan_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaintenancePlan" ADD CONSTRAINT "MaintenancePlan_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MaintenanceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MaintenancePlan" ADD CONSTRAINT "MaintenancePlan_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MaintenancePlan" ADD CONSTRAINT "MaintenancePlan_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaintenancePlan" ADD CONSTRAINT "MaintenancePlan_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MaintenanceOccurrence" ADD CONSTRAINT "MaintenanceOccurrence_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaintenanceOccurrence" ADD CONSTRAINT "MaintenanceOccurrence_maintenancePlanId_fkey" FOREIGN KEY ("maintenancePlanId") REFERENCES "MaintenancePlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaintenanceOccurrence" ADD CONSTRAINT "MaintenanceOccurrence_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "AgendaTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MaintenanceOccurrence" ADD CONSTRAINT "MaintenanceOccurrence_completedByUserId_fkey" FOREIGN KEY ("completedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MaintenanceOccurrence" ADD CONSTRAINT "MaintenanceOccurrence_skippedByUserId_fkey" FOREIGN KEY ("skippedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MaintenanceOccurrence" ADD CONSTRAINT "MaintenanceOccurrence_rescheduledByUserId_fkey" FOREIGN KEY ("rescheduledByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MaintenanceTaskLink" ADD CONSTRAINT "MaintenanceTaskLink_maintenanceOccurrenceId_fkey" FOREIGN KEY ("maintenanceOccurrenceId") REFERENCES "MaintenanceOccurrence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaintenanceTaskLink" ADD CONSTRAINT "MaintenanceTaskLink_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "AgendaTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaintenanceTaskLink" ADD CONSTRAINT "MaintenanceTaskLink_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MaintenanceOccurrenceDocument" ADD CONSTRAINT "MaintenanceOccurrenceDocument_maintenanceOccurrenceId_fkey" FOREIGN KEY ("maintenanceOccurrenceId") REFERENCES "MaintenanceOccurrence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MaintenanceOccurrenceDocument" ADD CONSTRAINT "MaintenanceOccurrenceDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaintenanceOccurrenceDocument" ADD CONSTRAINT "MaintenanceOccurrenceDocument_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MaintenanceOccurrenceTransaction" ADD CONSTRAINT "MaintenanceOccurrenceTransaction_maintenanceOccurrenceId_fkey" FOREIGN KEY ("maintenanceOccurrenceId") REFERENCES "MaintenanceOccurrence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MaintenanceOccurrenceTransaction" ADD CONSTRAINT "MaintenanceOccurrenceTransaction_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "FinancialTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaintenanceOccurrenceTransaction" ADD CONSTRAINT "MaintenanceOccurrenceTransaction_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
