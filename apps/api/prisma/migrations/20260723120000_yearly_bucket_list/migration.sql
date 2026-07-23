CREATE TYPE "YearlyBucketListStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED');
CREATE TYPE "BucketListItemStatus" AS ENUM ('PLANNED', 'COMPLETED', 'SKIPPED');
CREATE TYPE "BucketListItemPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH');
CREATE TYPE "BucketListItemCategory" AS ENUM (
  'TRAVEL',
  'EXPERIENCE',
  'SPORT',
  'RELATIONSHIP',
  'CULTURE',
  'LEARNING',
  'HOME',
  'FOOD',
  'NATURE',
  'PERSONAL',
  'OTHER'
);

CREATE TABLE "YearlyBucketList" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "householdId" UUID NOT NULL,
  "year" INTEGER NOT NULL,
  "title" VARCHAR(160) NOT NULL,
  "description" VARCHAR(1000),
  "status" "YearlyBucketListStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdByUserId" UUID NOT NULL,
  "updatedByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "closedAt" TIMESTAMP(3),
  "archivedAt" TIMESTAMP(3),
  CONSTRAINT "YearlyBucketList_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BucketListItem" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "householdId" UUID NOT NULL,
  "bucketListId" UUID NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "description" VARCHAR(2000),
  "category" "BucketListItemCategory" NOT NULL DEFAULT 'OTHER',
  "priority" "BucketListItemPriority" NOT NULL DEFAULT 'NORMAL',
  "status" "BucketListItemStatus" NOT NULL DEFAULT 'PLANNED',
  "targetDate" DATE,
  "locationPlaceId" UUID,
  "locationLabel" VARCHAR(300),
  "locationNotes" VARCHAR(1000),
  "notes" VARCHAR(10000),
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "carriedFromItemId" UUID,
  "createdByUserId" UUID NOT NULL,
  "updatedByUserId" UUID NOT NULL,
  "completedByUserId" UUID,
  "completedAt" TIMESTAMP(3),
  "skippedByUserId" UUID,
  "skippedAt" TIMESTAMP(3),
  "skippedReason" VARCHAR(1000),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BucketListItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BucketListItemParticipant" (
  "bucketListItemId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "addedByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BucketListItemParticipant_pkey" PRIMARY KEY ("bucketListItemId", "userId")
);

CREATE TABLE "BucketListItemDocument" (
  "bucketListItemId" UUID NOT NULL,
  "documentId" UUID NOT NULL,
  "createdByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BucketListItemDocument_pkey" PRIMARY KEY ("bucketListItemId", "documentId")
);

CREATE TABLE "BucketListItemCompletion" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "bucketListItemId" UUID NOT NULL,
  "householdId" UUID NOT NULL,
  "completedByUserId" UUID NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL,
  "note" VARCHAR(5000),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BucketListItemCompletion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "YearlyBucketList_householdId_year_key" ON "YearlyBucketList"("householdId", "year");
CREATE INDEX "YearlyBucketList_householdId_status_year_idx" ON "YearlyBucketList"("householdId", "status", "year");
CREATE INDEX "YearlyBucketList_createdByUserId_idx" ON "YearlyBucketList"("createdByUserId");
CREATE INDEX "YearlyBucketList_updatedByUserId_idx" ON "YearlyBucketList"("updatedByUserId");
CREATE UNIQUE INDEX "BucketListItem_carriedFromItemId_key" ON "BucketListItem"("carriedFromItemId");
CREATE INDEX "BucketListItem_householdId_bucketListId_status_sortOrder_idx" ON "BucketListItem"("householdId", "bucketListId", "status", "sortOrder");
CREATE INDEX "BucketListItem_householdId_category_status_idx" ON "BucketListItem"("householdId", "category", "status");
CREATE INDEX "BucketListItem_householdId_priority_status_idx" ON "BucketListItem"("householdId", "priority", "status");
CREATE INDEX "BucketListItem_householdId_targetDate_idx" ON "BucketListItem"("householdId", "targetDate");
CREATE INDEX "BucketListItem_locationPlaceId_idx" ON "BucketListItem"("locationPlaceId");
CREATE INDEX "BucketListItem_createdByUserId_idx" ON "BucketListItem"("createdByUserId");
CREATE INDEX "BucketListItem_updatedByUserId_idx" ON "BucketListItem"("updatedByUserId");
CREATE INDEX "BucketListItem_completedByUserId_idx" ON "BucketListItem"("completedByUserId");
CREATE INDEX "BucketListItem_skippedByUserId_idx" ON "BucketListItem"("skippedByUserId");
CREATE INDEX "BucketListItemParticipant_userId_bucketListItemId_idx" ON "BucketListItemParticipant"("userId", "bucketListItemId");
CREATE INDEX "BucketListItemParticipant_addedByUserId_idx" ON "BucketListItemParticipant"("addedByUserId");
CREATE INDEX "BucketListItemDocument_documentId_idx" ON "BucketListItemDocument"("documentId");
CREATE INDEX "BucketListItemDocument_createdByUserId_idx" ON "BucketListItemDocument"("createdByUserId");
CREATE INDEX "BucketListItemCompletion_bucketListItemId_completedAt_idx" ON "BucketListItemCompletion"("bucketListItemId", "completedAt");
CREATE INDEX "BucketListItemCompletion_householdId_completedAt_idx" ON "BucketListItemCompletion"("householdId", "completedAt");
CREATE INDEX "BucketListItemCompletion_completedByUserId_idx" ON "BucketListItemCompletion"("completedByUserId");

ALTER TABLE "YearlyBucketList" ADD CONSTRAINT "YearlyBucketList_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "YearlyBucketList" ADD CONSTRAINT "YearlyBucketList_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "YearlyBucketList" ADD CONSTRAINT "YearlyBucketList_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BucketListItem" ADD CONSTRAINT "BucketListItem_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BucketListItem" ADD CONSTRAINT "BucketListItem_bucketListId_fkey" FOREIGN KEY ("bucketListId") REFERENCES "YearlyBucketList"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BucketListItem" ADD CONSTRAINT "BucketListItem_locationPlaceId_fkey" FOREIGN KEY ("locationPlaceId") REFERENCES "SavedPlace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BucketListItem" ADD CONSTRAINT "BucketListItem_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BucketListItem" ADD CONSTRAINT "BucketListItem_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BucketListItem" ADD CONSTRAINT "BucketListItem_completedByUserId_fkey" FOREIGN KEY ("completedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BucketListItem" ADD CONSTRAINT "BucketListItem_skippedByUserId_fkey" FOREIGN KEY ("skippedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BucketListItem" ADD CONSTRAINT "BucketListItem_carriedFromItemId_fkey" FOREIGN KEY ("carriedFromItemId") REFERENCES "BucketListItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BucketListItemParticipant" ADD CONSTRAINT "BucketListItemParticipant_bucketListItemId_fkey" FOREIGN KEY ("bucketListItemId") REFERENCES "BucketListItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BucketListItemParticipant" ADD CONSTRAINT "BucketListItemParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BucketListItemParticipant" ADD CONSTRAINT "BucketListItemParticipant_addedByUserId_fkey" FOREIGN KEY ("addedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BucketListItemDocument" ADD CONSTRAINT "BucketListItemDocument_bucketListItemId_fkey" FOREIGN KEY ("bucketListItemId") REFERENCES "BucketListItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BucketListItemDocument" ADD CONSTRAINT "BucketListItemDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BucketListItemDocument" ADD CONSTRAINT "BucketListItemDocument_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BucketListItemCompletion" ADD CONSTRAINT "BucketListItemCompletion_bucketListItemId_fkey" FOREIGN KEY ("bucketListItemId") REFERENCES "BucketListItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BucketListItemCompletion" ADD CONSTRAINT "BucketListItemCompletion_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BucketListItemCompletion" ADD CONSTRAINT "BucketListItemCompletion_completedByUserId_fkey" FOREIGN KEY ("completedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
