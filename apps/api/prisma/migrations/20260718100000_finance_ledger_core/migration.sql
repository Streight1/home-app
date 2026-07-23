-- CreateEnum
CREATE TYPE "FinancialAccountType" AS ENUM ('CURRENT', 'SAVINGS', 'CASH', 'OTHER');

-- CreateEnum
CREATE TYPE "FinancialCategoryKind" AS ENUM ('EXPENSE', 'INCOME', 'BOTH');

-- CreateEnum
CREATE TYPE "FinancialTransactionType" AS ENUM ('EXPENSE', 'INCOME', 'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "FinancialTransactionSource" AS ENUM ('MANUAL', 'CSV_IMPORT', 'BANK_API');

-- CreateTable
CREATE TABLE "FinancialAccount" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "householdId" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "normalizedName" VARCHAR(120) NOT NULL,
    "type" "FinancialAccountType" NOT NULL,
    "currencyCode" VARCHAR(3) NOT NULL,
    "openingBalanceMinor" BIGINT NOT NULL,
    "openingBalanceDate" DATE NOT NULL,
    "description" VARCHAR(1000),
    "colorToken" VARCHAR(30) NOT NULL,
    "iconKey" VARCHAR(40) NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "updatedByUserId" UUID NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FinancialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialCategory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "householdId" UUID NOT NULL,
    "parentId" UUID,
    "name" VARCHAR(100) NOT NULL,
    "normalizedName" VARCHAR(100) NOT NULL,
    "kind" "FinancialCategoryKind" NOT NULL,
    "colorToken" VARCHAR(30) NOT NULL,
    "iconKey" VARCHAR(40) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdByUserId" UUID NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FinancialCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialTransaction" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "householdId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "categoryId" UUID,
    "type" "FinancialTransactionType" NOT NULL,
    "source" "FinancialTransactionSource" NOT NULL DEFAULT 'MANUAL',
    "amountMinor" BIGINT NOT NULL,
    "currencyCode" VARCHAR(3) NOT NULL,
    "bookedDate" DATE NOT NULL,
    "counterpartyName" VARCHAR(200),
    "counterpartyAccount" VARCHAR(100),
    "description" VARCHAR(1000),
    "variableSymbol" VARCHAR(20),
    "constantSymbol" VARCHAR(20),
    "specificSymbol" VARCHAR(20),
    "note" VARCHAR(10000),
    "transferId" UUID,
    "createdByUserId" UUID NOT NULL,
    "updatedByUserId" UUID NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedByUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FinancialTransaction_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FinancialTransaction_amount_positive" CHECK ("amountMinor" > 0)
);

-- CreateTable
CREATE TABLE "FinancialTransfer" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "householdId" UUID NOT NULL,
    "fromAccountId" UUID NOT NULL,
    "toAccountId" UUID NOT NULL,
    "outgoingTransactionId" UUID,
    "incomingTransactionId" UUID,
    "amountMinor" BIGINT NOT NULL,
    "currencyCode" VARCHAR(3) NOT NULL,
    "bookedDate" DATE NOT NULL,
    "note" VARCHAR(10000),
    "createdByUserId" UUID NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FinancialTransfer_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FinancialTransfer_amount_positive" CHECK ("amountMinor" > 0),
    CONSTRAINT "FinancialTransfer_different_accounts" CHECK ("fromAccountId" <> "toAccountId")
);

-- CreateTable
CREATE TABLE "FinancialTransactionDocument" (
    "transactionId" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinancialTransactionDocument_pkey" PRIMARY KEY ("transactionId", "documentId")
);

-- CreateIndex
CREATE INDEX "FinancialAccount_householdId_archivedAt_idx" ON "FinancialAccount"("householdId", "archivedAt");
CREATE INDEX "FinancialAccount_createdByUserId_idx" ON "FinancialAccount"("createdByUserId");
CREATE INDEX "FinancialAccount_updatedByUserId_idx" ON "FinancialAccount"("updatedByUserId");
CREATE UNIQUE INDEX "FinancialAccount_active_name_key" ON "FinancialAccount"("householdId", "normalizedName") WHERE "archivedAt" IS NULL;

CREATE UNIQUE INDEX "FinancialCategory_householdId_parentId_normalizedName_key" ON "FinancialCategory"("householdId", "parentId", "normalizedName");
CREATE UNIQUE INDEX "FinancialCategory_root_name_key" ON "FinancialCategory"("householdId", "normalizedName") WHERE "parentId" IS NULL;
CREATE INDEX "FinancialCategory_householdId_parentId_idx" ON "FinancialCategory"("householdId", "parentId");
CREATE INDEX "FinancialCategory_householdId_archivedAt_kind_idx" ON "FinancialCategory"("householdId", "archivedAt", "kind");
CREATE INDEX "FinancialCategory_createdByUserId_idx" ON "FinancialCategory"("createdByUserId");

CREATE INDEX "FinancialTransaction_householdId_bookedDate_idx" ON "FinancialTransaction"("householdId", "bookedDate");
CREATE INDEX "FinancialTransaction_accountId_bookedDate_idx" ON "FinancialTransaction"("accountId", "bookedDate");
CREATE INDEX "FinancialTransaction_categoryId_bookedDate_idx" ON "FinancialTransaction"("categoryId", "bookedDate");
CREATE INDEX "FinancialTransaction_transferId_idx" ON "FinancialTransaction"("transferId");
CREATE INDEX "FinancialTransaction_deletedAt_idx" ON "FinancialTransaction"("deletedAt");
CREATE INDEX "FinancialTransaction_householdId_deletedAt_bookedDate_idx" ON "FinancialTransaction"("householdId", "deletedAt", "bookedDate");
CREATE INDEX "FinancialTransaction_createdByUserId_idx" ON "FinancialTransaction"("createdByUserId");
CREATE INDEX "FinancialTransaction_updatedByUserId_idx" ON "FinancialTransaction"("updatedByUserId");
CREATE INDEX "FinancialTransaction_deletedByUserId_idx" ON "FinancialTransaction"("deletedByUserId");

CREATE UNIQUE INDEX "FinancialTransfer_outgoingTransactionId_key" ON "FinancialTransfer"("outgoingTransactionId");
CREATE UNIQUE INDEX "FinancialTransfer_incomingTransactionId_key" ON "FinancialTransfer"("incomingTransactionId");
CREATE INDEX "FinancialTransfer_householdId_bookedDate_idx" ON "FinancialTransfer"("householdId", "bookedDate");
CREATE INDEX "FinancialTransfer_fromAccountId_bookedDate_idx" ON "FinancialTransfer"("fromAccountId", "bookedDate");
CREATE INDEX "FinancialTransfer_toAccountId_bookedDate_idx" ON "FinancialTransfer"("toAccountId", "bookedDate");
CREATE INDEX "FinancialTransfer_createdByUserId_idx" ON "FinancialTransfer"("createdByUserId");
CREATE INDEX "FinancialTransfer_deletedAt_idx" ON "FinancialTransfer"("deletedAt");

CREATE INDEX "FinancialTransactionDocument_documentId_idx" ON "FinancialTransactionDocument"("documentId");
CREATE INDEX "FinancialTransactionDocument_createdByUserId_idx" ON "FinancialTransactionDocument"("createdByUserId");

-- AddForeignKey
ALTER TABLE "FinancialAccount" ADD CONSTRAINT "FinancialAccount_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialAccount" ADD CONSTRAINT "FinancialAccount_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialAccount" ADD CONSTRAINT "FinancialAccount_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FinancialCategory" ADD CONSTRAINT "FinancialCategory_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialCategory" ADD CONSTRAINT "FinancialCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "FinancialCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialCategory" ADD CONSTRAINT "FinancialCategory_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "FinancialAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FinancialCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "FinancialTransfer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_deletedByUserId_fkey" FOREIGN KEY ("deletedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FinancialTransfer" ADD CONSTRAINT "FinancialTransfer_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialTransfer" ADD CONSTRAINT "FinancialTransfer_fromAccountId_fkey" FOREIGN KEY ("fromAccountId") REFERENCES "FinancialAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialTransfer" ADD CONSTRAINT "FinancialTransfer_toAccountId_fkey" FOREIGN KEY ("toAccountId") REFERENCES "FinancialAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialTransfer" ADD CONSTRAINT "FinancialTransfer_outgoingTransactionId_fkey" FOREIGN KEY ("outgoingTransactionId") REFERENCES "FinancialTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialTransfer" ADD CONSTRAINT "FinancialTransfer_incomingTransactionId_fkey" FOREIGN KEY ("incomingTransactionId") REFERENCES "FinancialTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialTransfer" ADD CONSTRAINT "FinancialTransfer_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FinancialTransactionDocument" ADD CONSTRAINT "FinancialTransactionDocument_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "FinancialTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FinancialTransactionDocument" ADD CONSTRAINT "FinancialTransactionDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialTransactionDocument" ADD CONSTRAINT "FinancialTransactionDocument_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
