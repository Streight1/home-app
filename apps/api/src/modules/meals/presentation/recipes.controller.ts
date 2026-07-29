import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { RecipesService } from '../application/recipes.service.js';
import {
  CreateRecipeDto,
  ListRecipesQueryDto,
  ScaleRecipeQueryDto,
  UpdateRecipeDto,
} from './dto/recipes.dto.js';

@Controller('recipes')
export class RecipesController {
  public constructor(private readonly recipes: RecipesService) {}

  @Get()
  public list(
    @CurrentUser() principal: SessionPrincipal,
    @Query() query: ListRecipesQueryDto,
  ) {
    return this.recipes.list(principal.userId, query);
  }

  @Post()
  public create(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: CreateRecipeDto,
  ) {
    return this.recipes.create(principal.userId, input);
  }

  @Get(':recipeId')
  public detail(
    @CurrentUser() principal: SessionPrincipal,
    @Param('recipeId', new ParseUUIDPipe({ version: '4' })) recipeId: string,
  ) {
    return this.recipes.detail(principal.userId, recipeId);
  }

  @Patch(':recipeId')
  public update(
    @CurrentUser() principal: SessionPrincipal,
    @Param('recipeId', new ParseUUIDPipe({ version: '4' })) recipeId: string,
    @Body() input: UpdateRecipeDto,
  ) {
    return this.recipes.update(principal.userId, recipeId, input);
  }

  @Post(':recipeId/archive')
  public archive(
    @CurrentUser() principal: SessionPrincipal,
    @Param('recipeId', new ParseUUIDPipe({ version: '4' })) recipeId: string,
  ) {
    return this.recipes.setArchived(principal.userId, recipeId, true);
  }

  @Post(':recipeId/restore')
  public restore(
    @CurrentUser() principal: SessionPrincipal,
    @Param('recipeId', new ParseUUIDPipe({ version: '4' })) recipeId: string,
  ) {
    return this.recipes.setArchived(principal.userId, recipeId, false);
  }

  @Get(':recipeId/scaled')
  public scaled(
    @CurrentUser() principal: SessionPrincipal,
    @Param('recipeId', new ParseUUIDPipe({ version: '4' })) recipeId: string,
    @Query() query: ScaleRecipeQueryDto,
  ) {
    return this.recipes.scaled(principal.userId, recipeId, query.servings);
  }
}
