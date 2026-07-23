-- Extend the existing ledger without replacing or rewriting historical rows.
ALTER TYPE "FinancialAccountType" ADD VALUE IF NOT EXISTS 'CREDIT_CARD';
ALTER TYPE "FinancialTransactionType" ADD VALUE IF NOT EXISTS 'REFUND';

CREATE TYPE "FinanceImportSessionStatus" AS ENUM (
  'UPLOADED',
  'CONFIGURING',
  'READY_FOR_REVIEW',
  'COMMITTING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'EXPIRED'
);
CREATE TYPE "FinanceImportRowStatus" AS ENUM (
  'VALID',
  'INVALID',
  'POSSIBLE_DUPLICATE',
  'NEEDS_TRANSFER_REVIEW',
  'IMPORTED',
  'SKIPPED'
);
CREATE TYPE "FinanceImportSourceKind" AS ENUM ('BANK_ACCOUNT', 'CREDIT_CARD');
CREATE TYPE "FinanceAmountColumnMode" AS ENUM (
  'SIGNED_AMOUNT',
  'SEPARATE_DEBIT_CREDIT',
  'TRANSACTION_TYPE_AND_AMOUNT'
);
CREATE TYPE "FinancialCategorizationField" AS ENUM (
  'COUNTERPARTY_NAME',
  'COUNTERPARTY_ACCOUNT',
  'DESCRIPTION',
  'VARIABLE_SYMBOL'
);
CREATE TYPE "FinancialCategorizationOperator" AS ENUM (
  'EQUALS',
  'CONTAINS',
  'STARTS_WITH'
);

ALTER TABLE "FinancialAccount"
  ADD COLUMN "creditLimitMinor" BIGINT,
  ADD COLUMN "statementDayOfMonth" INTEGER,
  ADD COLUMN "paymentDueDayOfMonth" INTEGER,
  ADD COLUMN "maskedIdentifier" VARCHAR(20),
  ADD CONSTRAINT "FinancialAccount_credit_limit_nonnegative"
    CHECK ("creditLimitMinor" IS NULL OR "creditLimitMinor" >= 0),
  ADD CONSTRAINT "FinancialAccount_statement_day_range"
    CHECK ("statementDayOfMonth" IS NULL OR "statementDayOfMonth" BETWEEN 1 AND 31),
  ADD CONSTRAINT "FinancialAccount_payment_due_day_range"
    CHECK ("paymentDueDayOfMonth" IS NULL OR "paymentDueDayOfMonth" BETWEEN 1 AND 31);

ALTER TABLE "FinancialTransaction"
  ADD COLUMN "transactionDate" DATE,
  ADD COLUMN "externalTransactionId" VARCHAR(200),
  ADD COLUMN "fingerprint" CHAR(64),
  ADD COLUMN "merchantNormalizedName" VARCHAR(200),
  ADD COLUMN "importSessionId" UUID,
  ADD COLUMN "importRowId" UUID;

CREATE TABLE "FinanceImportProfile" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "householdId" UUID NOT NULL,
  "accountId" UUID,
  "name" VARCHAR(120) NOT NULL,
  "sourceKind" "FinanceImportSourceKind" NOT NULL,
  "encoding" VARCHAR(30) NOT NULL,
  "delimiter" VARCHAR(4) NOT NULL,
  "quoteCharacter" VARCHAR(1) NOT NULL,
  "hasHeader" BOOLEAN NOT NULL,
  "headerRowNumber" INTEGER NOT NULL,
  "skipRowsBefore" INTEGER NOT NULL,
  "dateFormat" VARCHAR(30) NOT NULL,
  "decimalSeparator" VARCHAR(1) NOT NULL,
  "thousandSeparator" VARCHAR(4) NOT NULL,
  "amountColumnMode" "FinanceAmountColumnMode" NOT NULL,
  "columnMappingJson" JSONB NOT NULL,
  "invertAmountSign" BOOLEAN NOT NULL DEFAULT false,
  "defaultCurrencyCode" VARCHAR(3),
  "createdByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FinanceImportProfile_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FinanceImportProfile_header_row_positive" CHECK ("headerRowNumber" >= 1),
  CONSTRAINT "FinanceImportProfile_skip_rows_nonnegative" CHECK ("skipRowsBefore" >= 0)
);

CREATE TABLE "FinanceImportSession" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "householdId" UUID NOT NULL,
  "accountId" UUID NOT NULL,
  "profileId" UUID,
  "sourceKind" "FinanceImportSourceKind" NOT NULL,
  "status" "FinanceImportSessionStatus" NOT NULL DEFAULT 'UPLOADED',
  "originalFilename" VARCHAR(200) NOT NULL,
  "temporaryStorageKey" VARCHAR(500),
  "fileChecksumSha256" CHAR(64) NOT NULL,
  "fileSizeBytes" INTEGER NOT NULL,
  "detectedEncoding" VARCHAR(30),
  "detectedDelimiter" VARCHAR(4),
  "detectedHeaderRow" INTEGER,
  "encoding" VARCHAR(30),
  "delimiter" VARCHAR(4),
  "quoteCharacter" VARCHAR(1),
  "hasHeader" BOOLEAN,
  "headerRowNumber" INTEGER,
  "skipRowsBefore" INTEGER,
  "dateFormat" VARCHAR(30),
  "decimalSeparator" VARCHAR(1),
  "thousandSeparator" VARCHAR(4),
  "amountColumnMode" "FinanceAmountColumnMode",
  "columnMappingJson" JSONB,
  "invertAmountSign" BOOLEAN NOT NULL DEFAULT false,
  "defaultCurrencyCode" VARCHAR(3),
  "totalRowCount" INTEGER NOT NULL DEFAULT 0,
  "validRowCount" INTEGER NOT NULL DEFAULT 0,
  "invalidRowCount" INTEGER NOT NULL DEFAULT 0,
  "duplicateRowCount" INTEGER NOT NULL DEFAULT 0,
  "ignoredRowCount" INTEGER NOT NULL DEFAULT 0,
  "importedRowCount" INTEGER NOT NULL DEFAULT 0,
  "createdByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "committedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  CONSTRAINT "FinanceImportSession_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FinanceImportSession_file_size_positive" CHECK ("fileSizeBytes" > 0),
  CONSTRAINT "FinanceImportSession_counts_nonnegative" CHECK (
    "totalRowCount" >= 0 AND "validRowCount" >= 0 AND
    "invalidRowCount" >= 0 AND "duplicateRowCount" >= 0 AND
    "ignoredRowCount" >= 0 AND "importedRowCount" >= 0
  )
);

CREATE TABLE "FinanceImportRow" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "importSessionId" UUID NOT NULL,
  "rowNumber" INTEGER NOT NULL,
  "status" "FinanceImportRowStatus" NOT NULL,
  "externalTransactionId" VARCHAR(200),
  "bookedDate" DATE,
  "transactionDate" DATE,
  "amountMinor" BIGINT,
  "currencyCode" VARCHAR(3),
  "transactionType" "FinancialTransactionType",
  "counterpartyName" VARCHAR(200),
  "counterpartyAccount" VARCHAR(100),
  "description" VARCHAR(1000),
  "variableSymbol" VARCHAR(20),
  "constantSymbol" VARCHAR(20),
  "specificSymbol" VARCHAR(20),
  "merchantNormalizedName" VARCHAR(200),
  "categoryId" UUID,
  "fingerprint" CHAR(64),
  "duplicateTransactionId" UUID,
  "transferSourceAccountId" UUID,
  "matchingTransactionId" UUID,
  "validationErrorsJson" JSONB NOT NULL DEFAULT '[]',
  "userIncluded" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FinanceImportRow_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FinanceImportRow_row_number_positive" CHECK ("rowNumber" >= 1),
  CONSTRAINT "FinanceImportRow_amount_positive" CHECK ("amountMinor" IS NULL OR "amountMinor" > 0)
);

CREATE TABLE "FinancialCategorizationRule" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "householdId" UUID NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "field" "FinancialCategorizationField" NOT NULL,
  "operator" "FinancialCategorizationOperator" NOT NULL,
  "comparisonValue" VARCHAR(300) NOT NULL,
  "normalizedComparisonValue" VARCHAR(300) NOT NULL,
  "categoryId" UUID NOT NULL,
  "accountId" UUID,
  "transactionType" "FinancialTransactionType",
  "createdByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FinancialCategorizationRule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FinanceImportProfile_householdId_name_key"
  ON "FinanceImportProfile"("householdId", "name");
CREATE INDEX "FinanceImportProfile_householdId_sourceKind_idx"
  ON "FinanceImportProfile"("householdId", "sourceKind");
CREATE INDEX "FinanceImportProfile_accountId_idx" ON "FinanceImportProfile"("accountId");
CREATE INDEX "FinanceImportProfile_createdByUserId_idx" ON "FinanceImportProfile"("createdByUserId");

CREATE INDEX "FinanceImportSession_householdId_createdAt_idx"
  ON "FinanceImportSession"("householdId", "createdAt");
CREATE INDEX "FinanceImportSession_householdId_accountId_status_idx"
  ON "FinanceImportSession"("householdId", "accountId", "status");
CREATE INDEX "FinanceImportSession_accountId_fileChecksumSha256_status_idx"
  ON "FinanceImportSession"("accountId", "fileChecksumSha256", "status");
CREATE INDEX "FinanceImportSession_expiresAt_status_idx"
  ON "FinanceImportSession"("expiresAt", "status");
CREATE INDEX "FinanceImportSession_profileId_idx" ON "FinanceImportSession"("profileId");
CREATE INDEX "FinanceImportSession_createdByUserId_idx" ON "FinanceImportSession"("createdByUserId");

CREATE UNIQUE INDEX "FinanceImportRow_importSessionId_rowNumber_key"
  ON "FinanceImportRow"("importSessionId", "rowNumber");
CREATE INDEX "FinanceImportRow_importSessionId_status_rowNumber_idx"
  ON "FinanceImportRow"("importSessionId", "status", "rowNumber");
CREATE INDEX "FinanceImportRow_categoryId_idx" ON "FinanceImportRow"("categoryId");
CREATE INDEX "FinanceImportRow_fingerprint_idx" ON "FinanceImportRow"("fingerprint");
CREATE INDEX "FinanceImportRow_duplicateTransactionId_idx" ON "FinanceImportRow"("duplicateTransactionId");
CREATE INDEX "FinanceImportRow_transferSourceAccountId_idx" ON "FinanceImportRow"("transferSourceAccountId");

CREATE INDEX "FinancialCategorizationRule_householdId_enabled_priority_idx"
  ON "FinancialCategorizationRule"("householdId", "enabled", "priority");
CREATE INDEX "FinancialCategorizationRule_categoryId_idx" ON "FinancialCategorizationRule"("categoryId");
CREATE INDEX "FinancialCategorizationRule_accountId_idx" ON "FinancialCategorizationRule"("accountId");
CREATE INDEX "FinancialCategorizationRule_createdByUserId_idx" ON "FinancialCategorizationRule"("createdByUserId");

CREATE UNIQUE INDEX "FinancialTransaction_importRowId_key" ON "FinancialTransaction"("importRowId");
CREATE UNIQUE INDEX "FinancialTransaction_external_source_key"
  ON "FinancialTransaction"("accountId", "source", "externalTransactionId");
CREATE INDEX "FinancialTransaction_importSessionId_idx" ON "FinancialTransaction"("importSessionId");
CREATE INDEX "FinancialTransaction_accountId_fingerprint_idx" ON "FinancialTransaction"("accountId", "fingerprint");

ALTER TABLE "FinanceImportProfile" ADD CONSTRAINT "FinanceImportProfile_householdId_fkey"
  FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinanceImportProfile" ADD CONSTRAINT "FinanceImportProfile_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "FinancialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinanceImportProfile" ADD CONSTRAINT "FinanceImportProfile_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FinanceImportSession" ADD CONSTRAINT "FinanceImportSession_householdId_fkey"
  FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinanceImportSession" ADD CONSTRAINT "FinanceImportSession_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "FinancialAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinanceImportSession" ADD CONSTRAINT "FinanceImportSession_profileId_fkey"
  FOREIGN KEY ("profileId") REFERENCES "FinanceImportProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinanceImportSession" ADD CONSTRAINT "FinanceImportSession_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FinanceImportRow" ADD CONSTRAINT "FinanceImportRow_importSessionId_fkey"
  FOREIGN KEY ("importSessionId") REFERENCES "FinanceImportSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FinanceImportRow" ADD CONSTRAINT "FinanceImportRow_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "FinancialCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinanceImportRow" ADD CONSTRAINT "FinanceImportRow_duplicateTransactionId_fkey"
  FOREIGN KEY ("duplicateTransactionId") REFERENCES "FinancialTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinanceImportRow" ADD CONSTRAINT "FinanceImportRow_transferSourceAccountId_fkey"
  FOREIGN KEY ("transferSourceAccountId") REFERENCES "FinancialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FinancialCategorizationRule" ADD CONSTRAINT "FinancialCategorizationRule_householdId_fkey"
  FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialCategorizationRule" ADD CONSTRAINT "FinancialCategorizationRule_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "FinancialCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialCategorizationRule" ADD CONSTRAINT "FinancialCategorizationRule_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "FinancialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FinancialCategorizationRule" ADD CONSTRAINT "FinancialCategorizationRule_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_importSessionId_fkey"
  FOREIGN KEY ("importSessionId") REFERENCES "FinanceImportSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_importRowId_fkey"
  FOREIGN KEY ("importRowId") REFERENCES "FinanceImportRow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
