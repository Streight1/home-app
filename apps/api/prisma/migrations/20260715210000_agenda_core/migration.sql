-- CreateEnum
CREATE TYPE "AgendaTaskStatus" AS ENUM ('OPEN', 'COMPLETED', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AgendaTaskPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "RecurrenceFrequency" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateTable
CREATE TABLE "TaskCategory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "householdId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "normalizedName" VARCHAR(100) NOT NULL,
    "colorToken" VARCHAR(30) NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TaskCategory_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TaskCategory_colorToken_check" CHECK ("colorToken" IN ('primary', 'blue', 'cyan', 'success', 'warning', 'danger'))
);

-- CreateTable
CREATE TABLE "AgendaTask" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "householdId" UUID NOT NULL,
    "categoryId" UUID,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "status" "AgendaTaskStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "AgendaTaskPriority" NOT NULL DEFAULT 'NORMAL',
    "assignedToUserId" UUID,
    "dueAt" TIMESTAMP(3),
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "timezone" VARCHAR(100) NOT NULL DEFAULT 'Europe/Prague',
    "recurrenceFrequency" "RecurrenceFrequency" NOT NULL DEFAULT 'NONE',
    "recurrenceInterval" INTEGER NOT NULL DEFAULT 1,
    "recurrenceDaysOfWeek" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    "recurrenceDayOfMonth" INTEGER,
    "recurrenceMonthOfYear" INTEGER,
    "recurrenceEndsAt" TIMESTAMP(3),
    "nextOccurrenceAt" TIMESTAMP(3),
    "createdByUserId" UUID NOT NULL,
    "updatedByUserId" UUID NOT NULL,
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgendaTask_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AgendaTask_recurrenceInterval_check" CHECK ("recurrenceInterval" >= 1),
    CONSTRAINT "AgendaTask_recurrenceDaysOfWeek_check" CHECK ("recurrenceDaysOfWeek" <@ ARRAY[1,2,3,4,5,6,7]),
    CONSTRAINT "AgendaTask_recurrenceDayOfMonth_check" CHECK ("recurrenceDayOfMonth" IS NULL OR "recurrenceDayOfMonth" BETWEEN 1 AND 31),
    CONSTRAINT "AgendaTask_recurrenceMonthOfYear_check" CHECK ("recurrenceMonthOfYear" IS NULL OR "recurrenceMonthOfYear" BETWEEN 1 AND 12),
    CONSTRAINT "AgendaTask_recurringDueAt_check" CHECK ("recurrenceFrequency" = 'NONE' OR "dueAt" IS NOT NULL)
);

-- CreateTable
CREATE TABLE "TaskCompletion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "taskId" UUID NOT NULL,
    "householdId" UUID NOT NULL,
    "completedByUserId" UUID NOT NULL,
    "occurrenceDueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3) NOT NULL,
    "note" VARCHAR(5000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskDocument" (
    "taskId" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskDocument_pkey" PRIMARY KEY ("taskId", "documentId")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaskCategory_householdId_normalizedName_key" ON "TaskCategory"("householdId", "normalizedName");
CREATE INDEX "TaskCategory_householdId_name_idx" ON "TaskCategory"("householdId", "name");
CREATE INDEX "TaskCategory_createdByUserId_idx" ON "TaskCategory"("createdByUserId");
CREATE INDEX "AgendaTask_householdId_status_dueAt_idx" ON "AgendaTask"("householdId", "status", "dueAt");
CREATE INDEX "AgendaTask_householdId_assignedToUserId_status_idx" ON "AgendaTask"("householdId", "assignedToUserId", "status");
CREATE INDEX "AgendaTask_householdId_categoryId_status_idx" ON "AgendaTask"("householdId", "categoryId", "status");
CREATE INDEX "AgendaTask_householdId_priority_dueAt_idx" ON "AgendaTask"("householdId", "priority", "dueAt");
CREATE INDEX "AgendaTask_createdByUserId_idx" ON "AgendaTask"("createdByUserId");
CREATE INDEX "AgendaTask_updatedByUserId_idx" ON "AgendaTask"("updatedByUserId");
CREATE INDEX "TaskCompletion_taskId_completedAt_idx" ON "TaskCompletion"("taskId", "completedAt");
CREATE INDEX "TaskCompletion_householdId_completedAt_idx" ON "TaskCompletion"("householdId", "completedAt");
CREATE INDEX "TaskCompletion_completedByUserId_idx" ON "TaskCompletion"("completedByUserId");
CREATE INDEX "TaskDocument_documentId_idx" ON "TaskDocument"("documentId");
CREATE INDEX "TaskDocument_createdByUserId_idx" ON "TaskDocument"("createdByUserId");

-- AddForeignKey
ALTER TABLE "TaskCategory" ADD CONSTRAINT "TaskCategory_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskCategory" ADD CONSTRAINT "TaskCategory_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgendaTask" ADD CONSTRAINT "AgendaTask_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgendaTask" ADD CONSTRAINT "AgendaTask_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TaskCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgendaTask" ADD CONSTRAINT "AgendaTask_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgendaTask" ADD CONSTRAINT "AgendaTask_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgendaTask" ADD CONSTRAINT "AgendaTask_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskCompletion" ADD CONSTRAINT "TaskCompletion_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "AgendaTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskCompletion" ADD CONSTRAINT "TaskCompletion_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskCompletion" ADD CONSTRAINT "TaskCompletion_completedByUserId_fkey" FOREIGN KEY ("completedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskDocument" ADD CONSTRAINT "TaskDocument_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "AgendaTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskDocument" ADD CONSTRAINT "TaskDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskDocument" ADD CONSTRAINT "TaskDocument_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
