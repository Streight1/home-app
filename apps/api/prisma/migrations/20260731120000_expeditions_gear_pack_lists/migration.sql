-- CreateEnum
CREATE TYPE "GearWeightStatus" AS ENUM ('VERIFIED', 'ESTIMATED', 'UNKNOWN');
CREATE TYPE "GearLoadType" AS ENUM ('CARRIED', 'WORN', 'CONSUMABLE');
CREATE TYPE "GearCriticality" AS ENUM ('REQUIRED', 'RECOMMENDED', 'OPTIONAL');
CREATE TYPE "GearDocumentRelationType" AS ENUM ('PHOTO', 'MANUAL', 'RECEIPT', 'OTHER');
CREATE TYPE "ExpeditionTripStatus" AS ENUM ('PLANNING', 'PACKING', 'READY', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "ExpeditionTripType" AS ENUM ('DAY_HIKE', 'OVERNIGHT', 'MULTI_DAY_TREK', 'HUT_TO_HUT', 'CAMPING', 'OTHER');
CREATE TYPE "TripParticipantRole" AS ENUM ('ORGANIZER', 'PARTICIPANT');
CREATE TYPE "GearPackingStatus" AS ENUM ('PLANNED', 'PACKED', 'MISSING', 'EXCLUDED');
CREATE TYPE "GearReviewOutcome" AS ENUM ('USED', 'UNUSED', 'MISSING_DURING_TRIP', 'BROKEN', 'NOT_REVIEWED');

-- CreateTable
CREATE TABLE "GearCategory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "householdId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "normalizedName" VARCHAR(100) NOT NULL,
    "iconKey" VARCHAR(50) NOT NULL DEFAULT 'backpack',
    "colorToken" VARCHAR(20) NOT NULL DEFAULT 'green',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdByUserId" UUID NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GearCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GearItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "householdId" UUID NOT NULL,
    "categoryId" UUID,
    "name" VARCHAR(200) NOT NULL,
    "normalizedName" VARCHAR(200) NOT NULL,
    "brand" VARCHAR(120),
    "model" VARCHAR(120),
    "description" VARCHAR(2000),
    "notes" VARCHAR(5000),
    "weightGrams" INTEGER NOT NULL DEFAULT 0,
    "weightStatus" "GearWeightStatus" NOT NULL DEFAULT 'UNKNOWN',
    "defaultLoadType" "GearLoadType" NOT NULL DEFAULT 'CARRIED',
    "defaultCriticality" "GearCriticality" NOT NULL DEFAULT 'RECOMMENDED',
    "ownerUserId" UUID,
    "isHouseholdShared" BOOLEAN NOT NULL DEFAULT true,
    "defaultQuantityDecimal" DECIMAL(12,3) NOT NULL DEFAULT 1,
    "purchaseUrl" VARCHAR(2000),
    "productUrl" VARCHAR(2000),
    "imageSourceUrl" VARCHAR(2000),
    "imageAttribution" VARCHAR(500),
    "createdByUserId" UUID NOT NULL,
    "updatedByUserId" UUID NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GearItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GearItemDocument" (
    "gearItemId" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "relationType" "GearDocumentRelationType" NOT NULL,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GearItemDocument_pkey" PRIMARY KEY ("gearItemId", "documentId")
);

CREATE TABLE "PackTemplate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "householdId" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" VARCHAR(3000),
    "tripType" "ExpeditionTripType" NOT NULL,
    "seasonLabel" VARCHAR(80),
    "targetBaseWeightGrams" INTEGER,
    "defaultParticipantCount" INTEGER NOT NULL DEFAULT 1,
    "createdByUserId" UUID NOT NULL,
    "updatedByUserId" UUID NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PackTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PackTemplateItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "packTemplateId" UUID NOT NULL,
    "gearItemId" UUID,
    "nameSnapshot" VARCHAR(200) NOT NULL,
    "customName" VARCHAR(200),
    "categoryId" UUID,
    "categoryNameSnapshot" VARCHAR(100),
    "quantityDecimal" DECIMAL(12,3) NOT NULL DEFAULT 1,
    "unitWeightGramsSnapshot" INTEGER NOT NULL DEFAULT 0,
    "loadType" "GearLoadType" NOT NULL,
    "criticality" "GearCriticality" NOT NULL,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "defaultAssignedUserId" UUID,
    "packLocationLabel" VARCHAR(120),
    "notes" VARCHAR(2000),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PackTemplateItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Trip" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "householdId" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" VARCHAR(3000),
    "tripType" "ExpeditionTripType" NOT NULL,
    "status" "ExpeditionTripStatus" NOT NULL DEFAULT 'PLANNING',
    "startsOn" DATE NOT NULL,
    "endsOn" DATE NOT NULL,
    "locationLabel" VARCHAR(300),
    "overnightCount" INTEGER NOT NULL DEFAULT 0,
    "targetBaseWeightGrams" INTEGER,
    "notes" VARCHAR(5000),
    "createdFromTemplateId" UUID,
    "createdByUserId" UUID NOT NULL,
    "updatedByUserId" UUID NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TripParticipant" (
    "tripId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "TripParticipantRole" NOT NULL DEFAULT 'PARTICIPANT',
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TripParticipant_pkey" PRIMARY KEY ("tripId", "userId")
);

CREATE TABLE "TripPackItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tripId" UUID NOT NULL,
    "sourceTemplateItemId" UUID,
    "gearItemId" UUID,
    "nameSnapshot" VARCHAR(200) NOT NULL,
    "categoryNameSnapshot" VARCHAR(100),
    "quantityDecimal" DECIMAL(12,3) NOT NULL DEFAULT 1,
    "unitWeightGramsSnapshot" INTEGER NOT NULL DEFAULT 0,
    "loadType" "GearLoadType" NOT NULL,
    "criticality" "GearCriticality" NOT NULL,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "assignedUserId" UUID,
    "packingStatus" "GearPackingStatus" NOT NULL DEFAULT 'PLANNED',
    "packLocationLabel" VARCHAR(120),
    "notes" VARCHAR(2000),
    "packedAt" TIMESTAMP(3),
    "packedByUserId" UUID,
    "reviewOutcome" "GearReviewOutcome" NOT NULL DEFAULT 'NOT_REVIEWED',
    "reviewNotes" VARCHAR(2000),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TripPackItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TripTaskLink" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tripId" UUID NOT NULL,
    "tripPackItemId" UUID,
    "taskId" UUID NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "removedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TripTaskLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TripReadinessAcknowledgement" (
    "tripId" UUID NOT NULL,
    "ruleCode" VARCHAR(80) NOT NULL,
    "acknowledgedByUserId" UUID NOT NULL,
    "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TripReadinessAcknowledgement_pkey" PRIMARY KEY ("tripId", "ruleCode")
);

-- CreateIndex
CREATE UNIQUE INDEX "GearCategory_householdId_normalizedName_key" ON "GearCategory"("householdId", "normalizedName");
CREATE INDEX "GearCategory_householdId_archivedAt_sortOrder_idx" ON "GearCategory"("householdId", "archivedAt", "sortOrder");
CREATE INDEX "GearCategory_createdByUserId_idx" ON "GearCategory"("createdByUserId");
CREATE INDEX "GearItem_householdId_archivedAt_idx" ON "GearItem"("householdId", "archivedAt");
CREATE INDEX "GearItem_householdId_normalizedName_idx" ON "GearItem"("householdId", "normalizedName");
CREATE INDEX "GearItem_categoryId_idx" ON "GearItem"("categoryId");
CREATE INDEX "GearItem_ownerUserId_idx" ON "GearItem"("ownerUserId");
CREATE INDEX "GearItem_createdByUserId_idx" ON "GearItem"("createdByUserId");
CREATE INDEX "GearItem_updatedByUserId_idx" ON "GearItem"("updatedByUserId");
CREATE INDEX "GearItemDocument_documentId_idx" ON "GearItemDocument"("documentId");
CREATE INDEX "GearItemDocument_gearItemId_isCover_idx" ON "GearItemDocument"("gearItemId", "isCover");
CREATE INDEX "GearItemDocument_createdByUserId_idx" ON "GearItemDocument"("createdByUserId");
CREATE UNIQUE INDEX "GearItemDocument_single_cover_key" ON "GearItemDocument"("gearItemId") WHERE "isCover" = true;
CREATE INDEX "PackTemplate_householdId_archivedAt_idx" ON "PackTemplate"("householdId", "archivedAt");
CREATE INDEX "PackTemplate_createdByUserId_idx" ON "PackTemplate"("createdByUserId");
CREATE INDEX "PackTemplate_updatedByUserId_idx" ON "PackTemplate"("updatedByUserId");
CREATE UNIQUE INDEX "PackTemplateItem_packTemplateId_sortOrder_key" ON "PackTemplateItem"("packTemplateId", "sortOrder");
CREATE INDEX "PackTemplateItem_gearItemId_idx" ON "PackTemplateItem"("gearItemId");
CREATE INDEX "PackTemplateItem_categoryId_idx" ON "PackTemplateItem"("categoryId");
CREATE INDEX "PackTemplateItem_defaultAssignedUserId_idx" ON "PackTemplateItem"("defaultAssignedUserId");
CREATE INDEX "Trip_householdId_archivedAt_idx" ON "Trip"("householdId", "archivedAt");
CREATE INDEX "Trip_householdId_status_startsOn_idx" ON "Trip"("householdId", "status", "startsOn");
CREATE INDEX "Trip_startsOn_idx" ON "Trip"("startsOn");
CREATE INDEX "Trip_createdFromTemplateId_idx" ON "Trip"("createdFromTemplateId");
CREATE INDEX "Trip_createdByUserId_idx" ON "Trip"("createdByUserId");
CREATE INDEX "Trip_updatedByUserId_idx" ON "Trip"("updatedByUserId");
CREATE INDEX "TripParticipant_userId_idx" ON "TripParticipant"("userId");
CREATE INDEX "TripParticipant_createdByUserId_idx" ON "TripParticipant"("createdByUserId");
CREATE UNIQUE INDEX "TripPackItem_tripId_sortOrder_key" ON "TripPackItem"("tripId", "sortOrder");
CREATE INDEX "TripPackItem_tripId_packingStatus_idx" ON "TripPackItem"("tripId", "packingStatus");
CREATE INDEX "TripPackItem_sourceTemplateItemId_idx" ON "TripPackItem"("sourceTemplateItemId");
CREATE INDEX "TripPackItem_gearItemId_idx" ON "TripPackItem"("gearItemId");
CREATE INDEX "TripPackItem_assignedUserId_idx" ON "TripPackItem"("assignedUserId");
CREATE INDEX "TripPackItem_packedByUserId_idx" ON "TripPackItem"("packedByUserId");
CREATE INDEX "TripTaskLink_tripId_removedAt_idx" ON "TripTaskLink"("tripId", "removedAt");
CREATE INDEX "TripTaskLink_tripPackItemId_removedAt_idx" ON "TripTaskLink"("tripPackItemId", "removedAt");
CREATE INDEX "TripTaskLink_taskId_removedAt_idx" ON "TripTaskLink"("taskId", "removedAt");
CREATE INDEX "TripTaskLink_createdByUserId_idx" ON "TripTaskLink"("createdByUserId");
CREATE INDEX "TripReadinessAcknowledgement_acknowledgedByUserId_idx" ON "TripReadinessAcknowledgement"("acknowledgedByUserId");

-- Domain invariants
ALTER TABLE "GearItem" ADD CONSTRAINT "GearItem_weightGrams_check" CHECK ("weightGrams" >= 0);
ALTER TABLE "GearItem" ADD CONSTRAINT "GearItem_defaultQuantityDecimal_check" CHECK ("defaultQuantityDecimal" > 0);
ALTER TABLE "PackTemplate" ADD CONSTRAINT "PackTemplate_targetBaseWeightGrams_check" CHECK ("targetBaseWeightGrams" IS NULL OR "targetBaseWeightGrams" >= 0);
ALTER TABLE "PackTemplate" ADD CONSTRAINT "PackTemplate_defaultParticipantCount_check" CHECK ("defaultParticipantCount" > 0);
ALTER TABLE "PackTemplateItem" ADD CONSTRAINT "PackTemplateItem_quantityDecimal_check" CHECK ("quantityDecimal" > 0);
ALTER TABLE "PackTemplateItem" ADD CONSTRAINT "PackTemplateItem_unitWeightGramsSnapshot_check" CHECK ("unitWeightGramsSnapshot" >= 0);
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_date_range_check" CHECK ("endsOn" >= "startsOn");
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_overnightCount_check" CHECK ("overnightCount" >= 0);
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_targetBaseWeightGrams_check" CHECK ("targetBaseWeightGrams" IS NULL OR "targetBaseWeightGrams" >= 0);
ALTER TABLE "TripPackItem" ADD CONSTRAINT "TripPackItem_quantityDecimal_check" CHECK ("quantityDecimal" > 0);
ALTER TABLE "TripPackItem" ADD CONSTRAINT "TripPackItem_unitWeightGramsSnapshot_check" CHECK ("unitWeightGramsSnapshot" >= 0);

-- AddForeignKey
ALTER TABLE "GearCategory" ADD CONSTRAINT "GearCategory_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GearCategory" ADD CONSTRAINT "GearCategory_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GearItem" ADD CONSTRAINT "GearItem_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GearItem" ADD CONSTRAINT "GearItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "GearCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GearItem" ADD CONSTRAINT "GearItem_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GearItem" ADD CONSTRAINT "GearItem_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GearItem" ADD CONSTRAINT "GearItem_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GearItemDocument" ADD CONSTRAINT "GearItemDocument_gearItemId_fkey" FOREIGN KEY ("gearItemId") REFERENCES "GearItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GearItemDocument" ADD CONSTRAINT "GearItemDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GearItemDocument" ADD CONSTRAINT "GearItemDocument_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PackTemplate" ADD CONSTRAINT "PackTemplate_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PackTemplate" ADD CONSTRAINT "PackTemplate_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PackTemplate" ADD CONSTRAINT "PackTemplate_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PackTemplateItem" ADD CONSTRAINT "PackTemplateItem_packTemplateId_fkey" FOREIGN KEY ("packTemplateId") REFERENCES "PackTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PackTemplateItem" ADD CONSTRAINT "PackTemplateItem_gearItemId_fkey" FOREIGN KEY ("gearItemId") REFERENCES "GearItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PackTemplateItem" ADD CONSTRAINT "PackTemplateItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "GearCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PackTemplateItem" ADD CONSTRAINT "PackTemplateItem_defaultAssignedUserId_fkey" FOREIGN KEY ("defaultAssignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_createdFromTemplateId_fkey" FOREIGN KEY ("createdFromTemplateId") REFERENCES "PackTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TripParticipant" ADD CONSTRAINT "TripParticipant_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TripParticipant" ADD CONSTRAINT "TripParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TripParticipant" ADD CONSTRAINT "TripParticipant_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TripPackItem" ADD CONSTRAINT "TripPackItem_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TripPackItem" ADD CONSTRAINT "TripPackItem_sourceTemplateItemId_fkey" FOREIGN KEY ("sourceTemplateItemId") REFERENCES "PackTemplateItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TripPackItem" ADD CONSTRAINT "TripPackItem_gearItemId_fkey" FOREIGN KEY ("gearItemId") REFERENCES "GearItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TripPackItem" ADD CONSTRAINT "TripPackItem_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TripPackItem" ADD CONSTRAINT "TripPackItem_packedByUserId_fkey" FOREIGN KEY ("packedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TripTaskLink" ADD CONSTRAINT "TripTaskLink_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TripTaskLink" ADD CONSTRAINT "TripTaskLink_tripPackItemId_fkey" FOREIGN KEY ("tripPackItemId") REFERENCES "TripPackItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TripTaskLink" ADD CONSTRAINT "TripTaskLink_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "AgendaTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TripTaskLink" ADD CONSTRAINT "TripTaskLink_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TripReadinessAcknowledgement" ADD CONSTRAINT "TripReadinessAcknowledgement_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TripReadinessAcknowledgement" ADD CONSTRAINT "TripReadinessAcknowledgement_acknowledgedByUserId_fkey" FOREIGN KEY ("acknowledgedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
