-- CreateEnum
CREATE TYPE "RecipeDifficulty" AS ENUM ('EASY', 'MEDIUM', 'ADVANCED', 'UNSPECIFIED');

-- CreateEnum
CREATE TYPE "IngredientUnit" AS ENUM ('G', 'KG', 'ML', 'L', 'TSP', 'TBSP', 'CUP', 'PIECE', 'PACKAGE', 'SLICE', 'PINCH', 'AS_NEEDED', 'CUSTOM');

-- CreateEnum
CREATE TYPE "RecipeDocumentRelationType" AS ENUM ('PHOTO', 'SOURCE', 'PRINTED_RECIPE', 'OTHER');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER', 'OTHER');

-- CreateEnum
CREATE TYPE "ShoppingListStatus" AS ENUM ('OPEN', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ShoppingItemSource" AS ENUM ('MANUAL', 'RECIPE', 'MEAL_PLAN', 'PANTRY_LOW_STOCK');

-- CreateEnum
CREATE TYPE "PantryStatus" AS ENUM ('AVAILABLE', 'LOW', 'OUT', 'UNKNOWN');

-- CreateTable
CREATE TABLE "RecipeCategory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "householdId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "normalizedName" VARCHAR(100) NOT NULL,
    "iconKey" VARCHAR(50) NOT NULL DEFAULT 'utensils',
    "colorToken" VARCHAR(20) NOT NULL DEFAULT 'violet',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdByUserId" UUID NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipeCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeTag" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "householdId" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "normalizedName" VARCHAR(80) NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipeTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "householdId" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "normalizedTitle" VARCHAR(200) NOT NULL,
    "description" VARCHAR(2000),
    "servings" DECIMAL(8,3) NOT NULL,
    "preparationMinutes" INTEGER,
    "cookingMinutes" INTEGER,
    "restingMinutes" INTEGER,
    "difficulty" "RecipeDifficulty" NOT NULL DEFAULT 'UNSPECIFIED',
    "categoryId" UUID,
    "sourceLabel" VARCHAR(200),
    "sourceUrl" VARCHAR(2000),
    "notes" VARCHAR(10000),
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" UUID NOT NULL,
    "updatedByUserId" UUID NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "householdId" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "normalizedName" VARCHAR(120) NOT NULL,
    "defaultUnit" "IngredientUnit",
    "shoppingCategoryId" UUID,
    "createdByUserId" UUID NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeIngredient" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recipeId" UUID NOT NULL,
    "ingredientId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "quantityDecimal" DECIMAL(12,3),
    "unit" "IngredientUnit" NOT NULL,
    "customUnitLabel" VARCHAR(50),
    "preparationNote" VARCHAR(300),
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "groupLabel" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeStep" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recipeId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "title" VARCHAR(120),
    "instruction" VARCHAR(5000) NOT NULL,
    "durationMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipeStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeTagLink" (
    "recipeId" UUID NOT NULL,
    "tagId" UUID NOT NULL,

    CONSTRAINT "RecipeTagLink_pkey" PRIMARY KEY ("recipeId","tagId")
);

-- CreateTable
CREATE TABLE "RecipeDocument" (
    "recipeId" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "relationType" "RecipeDocumentRelationType" NOT NULL,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecipeDocument_pkey" PRIMARY KEY ("recipeId","documentId")
);

-- CreateTable
CREATE TABLE "MealPlanEntry" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "householdId" UUID NOT NULL,
    "plannedFor" DATE NOT NULL,
    "mealType" "MealType" NOT NULL,
    "customMealTypeLabel" VARCHAR(80),
    "recipeId" UUID,
    "title" VARCHAR(200) NOT NULL,
    "servings" DECIMAL(8,3) NOT NULL,
    "notes" VARCHAR(2000),
    "createdByUserId" UUID NOT NULL,
    "updatedByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealPlanEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealPlanParticipant" (
    "mealPlanEntryId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MealPlanParticipant_pkey" PRIMARY KEY ("mealPlanEntryId","userId")
);

-- CreateTable
CREATE TABLE "ShoppingCategory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "householdId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "normalizedName" VARCHAR(100) NOT NULL,
    "iconKey" VARCHAR(50) NOT NULL DEFAULT 'shopping-basket',
    "colorToken" VARCHAR(20) NOT NULL DEFAULT 'cyan',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdByUserId" UUID NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingList" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "householdId" UUID NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "status" "ShoppingListStatus" NOT NULL DEFAULT 'OPEN',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" UUID NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingListItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "shoppingListId" UUID NOT NULL,
    "ingredientId" UUID,
    "text" VARCHAR(200) NOT NULL,
    "normalizedText" VARCHAR(200) NOT NULL,
    "quantityDecimal" DECIMAL(12,3),
    "unit" "IngredientUnit",
    "customUnitLabel" VARCHAR(50),
    "shoppingCategoryId" UUID,
    "note" VARCHAR(1000),
    "source" "ShoppingItemSource" NOT NULL DEFAULT 'MANUAL',
    "checkedAt" TIMESTAMP(3),
    "checkedByUserId" UUID,
    "createdByUserId" UUID NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingListItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingListItemSource" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "shoppingListId" UUID NOT NULL,
    "shoppingListItemId" UUID NOT NULL,
    "mealPlanEntryId" UUID,
    "recipeId" UUID,
    "recipeIngredientId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShoppingListItemSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PantryItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "householdId" UUID NOT NULL,
    "ingredientId" UUID NOT NULL,
    "quantityDecimal" DECIMAL(12,3),
    "unit" "IngredientUnit",
    "status" "PantryStatus" NOT NULL DEFAULT 'UNKNOWN',
    "expiresOn" DATE,
    "locationLabel" VARCHAR(120),
    "note" VARCHAR(1000),
    "updatedByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PantryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecipeCategory_householdId_archivedAt_sortOrder_idx" ON "RecipeCategory"("householdId", "archivedAt", "sortOrder");

-- CreateIndex
CREATE INDEX "RecipeCategory_createdByUserId_idx" ON "RecipeCategory"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeCategory_householdId_normalizedName_key" ON "RecipeCategory"("householdId", "normalizedName");

-- CreateIndex
CREATE INDEX "RecipeTag_householdId_archivedAt_idx" ON "RecipeTag"("householdId", "archivedAt");

-- CreateIndex
CREATE INDEX "RecipeTag_createdByUserId_idx" ON "RecipeTag"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeTag_householdId_normalizedName_key" ON "RecipeTag"("householdId", "normalizedName");

-- CreateIndex
CREATE INDEX "Recipe_householdId_archivedAt_idx" ON "Recipe"("householdId", "archivedAt");

-- CreateIndex
CREATE INDEX "Recipe_householdId_normalizedTitle_idx" ON "Recipe"("householdId", "normalizedTitle");

-- CreateIndex
CREATE INDEX "Recipe_categoryId_idx" ON "Recipe"("categoryId");

-- CreateIndex
CREATE INDEX "Recipe_createdByUserId_idx" ON "Recipe"("createdByUserId");

-- CreateIndex
CREATE INDEX "Recipe_updatedByUserId_idx" ON "Recipe"("updatedByUserId");

-- CreateIndex
CREATE INDEX "Ingredient_householdId_archivedAt_idx" ON "Ingredient"("householdId", "archivedAt");

-- CreateIndex
CREATE INDEX "Ingredient_shoppingCategoryId_idx" ON "Ingredient"("shoppingCategoryId");

-- CreateIndex
CREATE INDEX "Ingredient_createdByUserId_idx" ON "Ingredient"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_householdId_normalizedName_key" ON "Ingredient"("householdId", "normalizedName");

-- CreateIndex
CREATE INDEX "RecipeIngredient_ingredientId_idx" ON "RecipeIngredient"("ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeIngredient_recipeId_position_key" ON "RecipeIngredient"("recipeId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeStep_recipeId_position_key" ON "RecipeStep"("recipeId", "position");

-- CreateIndex
CREATE INDEX "RecipeTagLink_tagId_idx" ON "RecipeTagLink"("tagId");

-- CreateIndex
CREATE INDEX "RecipeDocument_documentId_idx" ON "RecipeDocument"("documentId");

-- CreateIndex
CREATE INDEX "RecipeDocument_createdByUserId_idx" ON "RecipeDocument"("createdByUserId");

-- CreateIndex
CREATE INDEX "MealPlanEntry_householdId_plannedFor_idx" ON "MealPlanEntry"("householdId", "plannedFor");

-- CreateIndex
CREATE INDEX "MealPlanEntry_recipeId_idx" ON "MealPlanEntry"("recipeId");

-- CreateIndex
CREATE INDEX "MealPlanEntry_createdByUserId_idx" ON "MealPlanEntry"("createdByUserId");

-- CreateIndex
CREATE INDEX "MealPlanEntry_updatedByUserId_idx" ON "MealPlanEntry"("updatedByUserId");

-- CreateIndex
CREATE INDEX "MealPlanParticipant_userId_idx" ON "MealPlanParticipant"("userId");

-- CreateIndex
CREATE INDEX "MealPlanParticipant_createdByUserId_idx" ON "MealPlanParticipant"("createdByUserId");

-- CreateIndex
CREATE INDEX "ShoppingCategory_householdId_archivedAt_sortOrder_idx" ON "ShoppingCategory"("householdId", "archivedAt", "sortOrder");

-- CreateIndex
CREATE INDEX "ShoppingCategory_createdByUserId_idx" ON "ShoppingCategory"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ShoppingCategory_householdId_normalizedName_key" ON "ShoppingCategory"("householdId", "normalizedName");

-- CreateIndex
CREATE INDEX "ShoppingList_householdId_status_idx" ON "ShoppingList"("householdId", "status");

-- CreateIndex
CREATE INDEX "ShoppingList_createdByUserId_idx" ON "ShoppingList"("createdByUserId");

-- CreateIndex
CREATE INDEX "ShoppingListItem_shoppingListId_checkedAt_idx" ON "ShoppingListItem"("shoppingListId", "checkedAt");

-- CreateIndex
CREATE INDEX "ShoppingListItem_ingredientId_idx" ON "ShoppingListItem"("ingredientId");

-- CreateIndex
CREATE INDEX "ShoppingListItem_shoppingCategoryId_idx" ON "ShoppingListItem"("shoppingCategoryId");

-- CreateIndex
CREATE INDEX "ShoppingListItem_createdByUserId_idx" ON "ShoppingListItem"("createdByUserId");

-- CreateIndex
CREATE INDEX "ShoppingListItem_checkedByUserId_idx" ON "ShoppingListItem"("checkedByUserId");

-- CreateIndex
CREATE INDEX "ShoppingListItemSource_mealPlanEntryId_idx" ON "ShoppingListItemSource"("mealPlanEntryId");

-- CreateIndex
CREATE INDEX "ShoppingListItemSource_recipeId_idx" ON "ShoppingListItemSource"("recipeId");

-- CreateIndex
CREATE INDEX "ShoppingListItemSource_recipeIngredientId_idx" ON "ShoppingListItemSource"("recipeIngredientId");

-- CreateIndex
CREATE UNIQUE INDEX "ShoppingListItemSource_shoppingListId_mealPlanEntryId_recipe_key" ON "ShoppingListItemSource"("shoppingListId", "mealPlanEntryId", "recipeIngredientId");

-- CreateIndex
CREATE INDEX "ShoppingListItemSource_shoppingListItemId_idx" ON "ShoppingListItemSource"("shoppingListItemId");

-- CreateIndex
CREATE INDEX "PantryItem_householdId_ingredientId_idx" ON "PantryItem"("householdId", "ingredientId");

-- CreateIndex
CREATE INDEX "PantryItem_expiresOn_idx" ON "PantryItem"("expiresOn");

-- CreateIndex
CREATE INDEX "PantryItem_updatedByUserId_idx" ON "PantryItem"("updatedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "PantryItem_householdId_ingredientId_key" ON "PantryItem"("householdId", "ingredientId");

-- AddForeignKey
ALTER TABLE "RecipeCategory" ADD CONSTRAINT "RecipeCategory_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeCategory" ADD CONSTRAINT "RecipeCategory_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeTag" ADD CONSTRAINT "RecipeTag_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeTag" ADD CONSTRAINT "RecipeTag_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "RecipeCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_shoppingCategoryId_fkey" FOREIGN KEY ("shoppingCategoryId") REFERENCES "ShoppingCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeStep" ADD CONSTRAINT "RecipeStep_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeTagLink" ADD CONSTRAINT "RecipeTagLink_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeTagLink" ADD CONSTRAINT "RecipeTagLink_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "RecipeTag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeDocument" ADD CONSTRAINT "RecipeDocument_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeDocument" ADD CONSTRAINT "RecipeDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeDocument" ADD CONSTRAINT "RecipeDocument_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlanEntry" ADD CONSTRAINT "MealPlanEntry_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlanEntry" ADD CONSTRAINT "MealPlanEntry_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlanEntry" ADD CONSTRAINT "MealPlanEntry_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlanEntry" ADD CONSTRAINT "MealPlanEntry_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlanParticipant" ADD CONSTRAINT "MealPlanParticipant_mealPlanEntryId_fkey" FOREIGN KEY ("mealPlanEntryId") REFERENCES "MealPlanEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlanParticipant" ADD CONSTRAINT "MealPlanParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlanParticipant" ADD CONSTRAINT "MealPlanParticipant_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingCategory" ADD CONSTRAINT "ShoppingCategory_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingCategory" ADD CONSTRAINT "ShoppingCategory_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingList" ADD CONSTRAINT "ShoppingList_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingList" ADD CONSTRAINT "ShoppingList_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_shoppingListId_fkey" FOREIGN KEY ("shoppingListId") REFERENCES "ShoppingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_shoppingCategoryId_fkey" FOREIGN KEY ("shoppingCategoryId") REFERENCES "ShoppingCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_checkedByUserId_fkey" FOREIGN KEY ("checkedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListItemSource" ADD CONSTRAINT "ShoppingListItemSource_shoppingListId_fkey" FOREIGN KEY ("shoppingListId") REFERENCES "ShoppingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListItemSource" ADD CONSTRAINT "ShoppingListItemSource_shoppingListItemId_fkey" FOREIGN KEY ("shoppingListItemId") REFERENCES "ShoppingListItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListItemSource" ADD CONSTRAINT "ShoppingListItemSource_mealPlanEntryId_fkey" FOREIGN KEY ("mealPlanEntryId") REFERENCES "MealPlanEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListItemSource" ADD CONSTRAINT "ShoppingListItemSource_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListItemSource" ADD CONSTRAINT "ShoppingListItemSource_recipeIngredientId_fkey" FOREIGN KEY ("recipeIngredientId") REFERENCES "RecipeIngredient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryItem" ADD CONSTRAINT "PantryItem_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryItem" ADD CONSTRAINT "PantryItem_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryItem" ADD CONSTRAINT "PantryItem_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "CalendarEvent_householdId_status_allDayStartDate_allDayEndDateE" RENAME TO "CalendarEvent_householdId_status_allDayStartDate_allDayEndD_idx";

-- RenameIndex
ALTER INDEX "FinancialTransaction_external_source_key" RENAME TO "FinancialTransaction_accountId_source_externalTransactionId_key";

-- RenameIndex
ALTER INDEX "MaintenanceOccurrence_maintenancePlanId_originalScheduledFor_ke" RENAME TO "MaintenanceOccurrence_maintenancePlanId_originalScheduledFo_key";

-- RenameIndex
ALTER INDEX "RecurringExpense_householdId_merchant_currency_idx" RENAME TO "RecurringExpense_householdId_merchantNormalizedName_currenc_idx";

-- RenameIndex
ALTER INDEX "RecurringExpenseCandidate_householdId_merchant_currency_idx" RENAME TO "RecurringExpenseCandidate_householdId_merchantNormalizedNam_idx";

-- RenameIndex
ALTER INDEX "RecurringExpenseCandidate_household_account_merchant_currency_k" RENAME TO "RecurringExpenseCandidate_householdId_accountId_merchantNor_key";

-- RenameIndex
ALTER INDEX "SpendingInsight_householdId_currencyCode_periodStart_periodEnd_" RENAME TO "SpendingInsight_householdId_currencyCode_periodStart_period_idx";

-- Domain invariants not expressible in Prisma's schema language.
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_servings_positive_check" CHECK ("servings" > 0);
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_quantity_nonnegative_check" CHECK ("quantityDecimal" IS NULL OR "quantityDecimal" >= 0);
ALTER TABLE "MealPlanEntry" ADD CONSTRAINT "MealPlanEntry_servings_positive_check" CHECK ("servings" > 0);
ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_quantity_nonnegative_check" CHECK ("quantityDecimal" IS NULL OR "quantityDecimal" >= 0);
ALTER TABLE "PantryItem" ADD CONSTRAINT "PantryItem_quantity_nonnegative_check" CHECK ("quantityDecimal" IS NULL OR "quantityDecimal" >= 0);
CREATE UNIQUE INDEX "ShoppingList_single_open_default_key" ON "ShoppingList"("householdId") WHERE "isDefault" = true AND "status" = 'OPEN' AND "archivedAt" IS NULL;
CREATE UNIQUE INDEX "RecipeDocument_single_cover_key" ON "RecipeDocument"("recipeId") WHERE "isCover" = true;
