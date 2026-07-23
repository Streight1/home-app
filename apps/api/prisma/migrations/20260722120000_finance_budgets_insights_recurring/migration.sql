CREATE TYPE "FinancialBudgetPeriodType" AS ENUM ('MONTHLY', 'CUSTOM');
CREATE TYPE "FinancialBudgetStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED');
CREATE TYPE "SpendingInsightType" AS ENUM ('BUDGET_THRESHOLD_REACHED', 'BUDGET_EXCEEDED', 'BUDGET_FORECAST_EXCEEDED', 'CATEGORY_SPENDING_INCREASE', 'MERCHANT_SPENDING_INCREASE', 'FREQUENT_SMALL_PURCHASES', 'UNCATEGORIZED_SPENDING_HIGH', 'NEW_LARGE_EXPENSE', 'POSSIBLE_RECURRING_PAYMENT');
CREATE TYPE "SpendingInsightSeverity" AS ENUM ('INFO', 'WARNING', 'IMPORTANT');
CREATE TYPE "SpendingInsightStatus" AS ENUM ('NEW', 'ACKNOWLEDGED', 'DISMISSED', 'RESOLVED');
CREATE TYPE "RecurringExpenseCandidateStatus" AS ENUM ('PROPOSED', 'CONFIRMED', 'DISMISSED', 'INACTIVE');
CREATE TYPE "RecurringExpenseFrequency" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'IRREGULAR');
CREATE TYPE "RecurringExpenseStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ENDED', 'ARCHIVED');

CREATE TABLE "FinancialBudget" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "householdId" UUID NOT NULL,
  "name" VARCHAR(120) NOT NULL, "currencyCode" VARCHAR(3) NOT NULL,
  "periodType" "FinancialBudgetPeriodType" NOT NULL, "periodStart" DATE NOT NULL,
  "periodEnd" DATE NOT NULL, "totalLimitMinor" BIGINT,
  "status" "FinancialBudgetStatus" NOT NULL DEFAULT 'DRAFT',
  "createdByUserId" UUID NOT NULL, "updatedByUserId" UUID NOT NULL,
  "archivedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "FinancialBudget_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FinancialBudget_period_check" CHECK ("periodEnd" >= "periodStart"),
  CONSTRAINT "FinancialBudget_total_limit_check" CHECK ("totalLimitMinor" IS NULL OR "totalLimitMinor" > 0)
);
CREATE TABLE "FinancialBudgetAllocation" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "budgetId" UUID NOT NULL,
  "categoryId" UUID NOT NULL, "limitMinor" BIGINT NOT NULL,
  "warningThresholdPercent" INTEGER NOT NULL DEFAULT 80,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FinancialBudgetAllocation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FinancialBudgetAllocation_limit_check" CHECK ("limitMinor" > 0),
  CONSTRAINT "FinancialBudgetAllocation_warning_check" CHECK ("warningThresholdPercent" BETWEEN 1 AND 100)
);
CREATE TABLE "SpendingInsight" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "householdId" UUID NOT NULL,
  "type" "SpendingInsightType" NOT NULL, "currencyCode" VARCHAR(3) NOT NULL,
  "periodStart" DATE NOT NULL, "periodEnd" DATE NOT NULL,
  "severity" "SpendingInsightSeverity" NOT NULL,
  "status" "SpendingInsightStatus" NOT NULL DEFAULT 'NEW',
  "title" VARCHAR(180) NOT NULL, "explanation" VARCHAR(1000) NOT NULL,
  "evidenceJson" JSONB NOT NULL, "evidenceHash" CHAR(64) NOT NULL,
  "firstDetectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastDetectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "acknowledgedAt" TIMESTAMP(3), "dismissedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SpendingInsight_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RecurringExpenseCandidate" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "householdId" UUID NOT NULL,
  "accountId" UUID NOT NULL, "merchantNormalizedName" VARCHAR(200) NOT NULL,
  "categoryId" UUID, "currencyCode" VARCHAR(3) NOT NULL, "typicalAmountMinor" BIGINT NOT NULL,
  "amountTolerancePercent" INTEGER NOT NULL DEFAULT 15,
  "detectedFrequency" "RecurringExpenseFrequency" NOT NULL, "nextExpectedDate" DATE,
  "confidenceScore" INTEGER NOT NULL, "evidenceTransactionCount" INTEGER NOT NULL,
  "status" "RecurringExpenseCandidateStatus" NOT NULL DEFAULT 'PROPOSED',
  "firstObservedDate" DATE NOT NULL, "lastObservedDate" DATE NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RecurringExpenseCandidate_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RecurringExpenseCandidate_amount_check" CHECK ("typicalAmountMinor" > 0),
  CONSTRAINT "RecurringExpenseCandidate_tolerance_check" CHECK ("amountTolerancePercent" BETWEEN 0 AND 100),
  CONSTRAINT "RecurringExpenseCandidate_confidence_check" CHECK ("confidenceScore" BETWEEN 0 AND 100),
  CONSTRAINT "RecurringExpenseCandidate_evidence_check" CHECK ("evidenceTransactionCount" >= 3)
);
CREATE TABLE "RecurringExpense" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "householdId" UUID NOT NULL,
  "candidateId" UUID, "name" VARCHAR(160) NOT NULL,
  "merchantNormalizedName" VARCHAR(200) NOT NULL, "categoryId" UUID, "accountId" UUID,
  "currencyCode" VARCHAR(3) NOT NULL, "expectedAmountMinor" BIGINT NOT NULL,
  "amountTolerancePercent" INTEGER NOT NULL DEFAULT 15,
  "frequency" "RecurringExpenseFrequency" NOT NULL, "nextExpectedDate" DATE,
  "status" "RecurringExpenseStatus" NOT NULL DEFAULT 'ACTIVE', "createdByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  "archivedAt" TIMESTAMP(3), CONSTRAINT "RecurringExpense_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RecurringExpense_amount_check" CHECK ("expectedAmountMinor" > 0),
  CONSTRAINT "RecurringExpense_tolerance_check" CHECK ("amountTolerancePercent" BETWEEN 0 AND 100)
);

CREATE INDEX "FinancialBudget_householdId_periodStart_periodEnd_idx" ON "FinancialBudget"("householdId", "periodStart", "periodEnd");
CREATE INDEX "FinancialBudget_householdId_currencyCode_status_periodStart_idx" ON "FinancialBudget"("householdId", "currencyCode", "status", "periodStart");
CREATE INDEX "FinancialBudget_createdByUserId_idx" ON "FinancialBudget"("createdByUserId");
CREATE INDEX "FinancialBudget_updatedByUserId_idx" ON "FinancialBudget"("updatedByUserId");
CREATE UNIQUE INDEX "FinancialBudget_active_period_key" ON "FinancialBudget"("householdId", "currencyCode", "periodStart", "periodEnd") WHERE "status" = 'ACTIVE';
CREATE UNIQUE INDEX "FinancialBudgetAllocation_budgetId_categoryId_key" ON "FinancialBudgetAllocation"("budgetId", "categoryId");
CREATE INDEX "FinancialBudgetAllocation_categoryId_idx" ON "FinancialBudgetAllocation"("categoryId");
CREATE UNIQUE INDEX "SpendingInsight_householdId_evidenceHash_key" ON "SpendingInsight"("householdId", "evidenceHash");
CREATE INDEX "SpendingInsight_householdId_status_periodEnd_idx" ON "SpendingInsight"("householdId", "status", "periodEnd");
CREATE INDEX "SpendingInsight_householdId_currencyCode_periodStart_periodEnd_idx" ON "SpendingInsight"("householdId", "currencyCode", "periodStart", "periodEnd");
CREATE INDEX "SpendingInsight_evidenceHash_idx" ON "SpendingInsight"("evidenceHash");
CREATE UNIQUE INDEX "RecurringExpenseCandidate_household_account_merchant_currency_key" ON "RecurringExpenseCandidate"("householdId", "accountId", "merchantNormalizedName", "currencyCode");
CREATE INDEX "RecurringExpenseCandidate_householdId_status_idx" ON "RecurringExpenseCandidate"("householdId", "status");
CREATE INDEX "RecurringExpenseCandidate_householdId_merchant_currency_idx" ON "RecurringExpenseCandidate"("householdId", "merchantNormalizedName", "currencyCode");
CREATE INDEX "RecurringExpenseCandidate_categoryId_idx" ON "RecurringExpenseCandidate"("categoryId");
CREATE UNIQUE INDEX "RecurringExpense_candidateId_key" ON "RecurringExpense"("candidateId");
CREATE INDEX "RecurringExpense_householdId_status_nextExpectedDate_idx" ON "RecurringExpense"("householdId", "status", "nextExpectedDate");
CREATE INDEX "RecurringExpense_householdId_merchant_currency_idx" ON "RecurringExpense"("householdId", "merchantNormalizedName", "currencyCode");
CREATE INDEX "RecurringExpense_categoryId_idx" ON "RecurringExpense"("categoryId");
CREATE INDEX "RecurringExpense_accountId_idx" ON "RecurringExpense"("accountId");
CREATE INDEX "RecurringExpense_createdByUserId_idx" ON "RecurringExpense"("createdByUserId");

ALTER TABLE "FinancialBudget" ADD CONSTRAINT "FinancialBudget_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialBudget" ADD CONSTRAINT "FinancialBudget_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialBudget" ADD CONSTRAINT "FinancialBudget_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialBudgetAllocation" ADD CONSTRAINT "FinancialBudgetAllocation_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "FinancialBudget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FinancialBudgetAllocation" ADD CONSTRAINT "FinancialBudgetAllocation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FinancialCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SpendingInsight" ADD CONSTRAINT "SpendingInsight_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RecurringExpenseCandidate" ADD CONSTRAINT "RecurringExpenseCandidate_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RecurringExpenseCandidate" ADD CONSTRAINT "RecurringExpenseCandidate_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "FinancialAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RecurringExpenseCandidate" ADD CONSTRAINT "RecurringExpenseCandidate_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FinancialCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "RecurringExpenseCandidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FinancialCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "FinancialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
