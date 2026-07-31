CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION homeapp_search_normalize(value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
RETURNS NULL ON NULL INPUT
AS $$
  SELECT regexp_replace(lower(public.unaccent('public.unaccent', value)), '\s+', ' ', 'g');
$$;

CREATE INDEX "Document_search_title_trgm_idx"
  ON "Document" USING gin (homeapp_search_normalize("title") gin_trgm_ops);
CREATE INDEX "AgendaTask_search_title_trgm_idx"
  ON "AgendaTask" USING gin (homeapp_search_normalize("title") gin_trgm_ops);
CREATE INDEX "MaintenancePlan_search_title_trgm_idx"
  ON "MaintenancePlan" USING gin (homeapp_search_normalize("title") gin_trgm_ops);
CREATE INDEX "CalendarEvent_search_title_trgm_idx"
  ON "CalendarEvent" USING gin (homeapp_search_normalize("title") gin_trgm_ops);
CREATE INDEX "FinancialTransaction_search_counterparty_trgm_idx"
  ON "FinancialTransaction" USING gin (homeapp_search_normalize("counterpartyName") gin_trgm_ops);
CREATE INDEX "BucketListItem_search_title_trgm_idx"
  ON "BucketListItem" USING gin (homeapp_search_normalize("title") gin_trgm_ops);
CREATE INDEX "Recipe_search_title_trgm_idx"
  ON "Recipe" USING gin (homeapp_search_normalize("title") gin_trgm_ops);
CREATE INDEX "Ingredient_search_name_trgm_idx"
  ON "Ingredient" USING gin (homeapp_search_normalize("name") gin_trgm_ops);
CREATE INDEX "MealPlanEntry_search_title_trgm_idx"
  ON "MealPlanEntry" USING gin (homeapp_search_normalize("title") gin_trgm_ops);
CREATE INDEX "ShoppingList_search_title_trgm_idx"
  ON "ShoppingList" USING gin (homeapp_search_normalize("title") gin_trgm_ops);
CREATE INDEX "ShoppingListItem_search_text_trgm_idx"
  ON "ShoppingListItem" USING gin (homeapp_search_normalize("text") gin_trgm_ops);
CREATE INDEX "Trip_search_title_trgm_idx"
  ON "Trip" USING gin (homeapp_search_normalize("title") gin_trgm_ops);
CREATE INDEX "GearItem_search_name_trgm_idx"
  ON "GearItem" USING gin (homeapp_search_normalize("name") gin_trgm_ops);
CREATE INDEX "GearItem_search_brand_trgm_idx"
  ON "GearItem" USING gin (homeapp_search_normalize("brand") gin_trgm_ops);
CREATE INDEX "GearItem_search_model_trgm_idx"
  ON "GearItem" USING gin (homeapp_search_normalize("model") gin_trgm_ops);
CREATE INDEX "PackTemplate_search_name_trgm_idx"
  ON "PackTemplate" USING gin (homeapp_search_normalize("name") gin_trgm_ops);
