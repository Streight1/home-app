import { Module } from '@nestjs/common';
import { APPLICATION_SEARCH_PROVIDER_TOKENS } from '../../common/search/application-search-provider.js';
import { AuditModule } from '../audit/audit.module.js';
import { DocumentsModule } from '../documents/documents.module.js';
import { HouseholdsModule } from '../households/households.module.js';
import { MealPlanningService } from './application/meal-planning.service.js';
import { MealsCatalogService } from './application/meals-catalog.service.js';
import { MealsDashboardService } from './application/meals-dashboard.service.js';
import { PantryService } from './application/pantry.service.js';
import { RecipesService } from './application/recipes.service.js';
import { ShoppingGenerationService } from './application/shopping-generation.service.js';
import { ShoppingService } from './application/shopping.service.js';
import { MealsFacade } from './meals.facade.js';
import { MealPlanController } from './presentation/meal-plan.controller.js';
import { MealsMetadataController } from './presentation/meals-metadata.controller.js';
import { PantryController } from './presentation/pantry.controller.js';
import { RecipesController } from './presentation/recipes.controller.js';
import {
  ShoppingListItemsController,
  ShoppingListsController,
} from './presentation/shopping.controller.js';
import { MealsSearchProvider } from './search/meals-search.provider.js';

@Module({
  imports: [AuditModule, DocumentsModule, HouseholdsModule],
  controllers: [
    RecipesController,
    MealPlanController,
    ShoppingListsController,
    ShoppingListItemsController,
    PantryController,
    MealsMetadataController,
  ],
  providers: [
    RecipesService,
    MealPlanningService,
    ShoppingService,
    ShoppingGenerationService,
    PantryService,
    MealsCatalogService,
    MealsDashboardService,
    MealsFacade,
    MealsSearchProvider,
    {
      provide: APPLICATION_SEARCH_PROVIDER_TOKENS.meals,
      useExisting: MealsSearchProvider,
    },
  ],
  exports: [MealsFacade, APPLICATION_SEARCH_PROVIDER_TOKENS.meals],
})
export class MealsModule {}
