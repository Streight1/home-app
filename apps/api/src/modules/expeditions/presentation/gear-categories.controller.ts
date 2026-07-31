import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { GearCategoriesService } from '../application/gear-categories.service.js';
import { GearCategoryInputDto } from './dto/gear.dto.js';

@Controller('gear-categories')
export class GearCategoriesController {
  public constructor(private readonly categories: GearCategoriesService) {}

  @Get()
  public list(@CurrentUser() principal: SessionPrincipal) {
    return this.categories.list(principal.userId);
  }

  @Post()
  public create(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: GearCategoryInputDto,
  ) {
    return this.categories.create(principal.userId, input);
  }

  @Patch(':categoryId')
  public update(
    @CurrentUser() principal: SessionPrincipal,
    @Param('categoryId', new ParseUUIDPipe({ version: '4' }))
    categoryId: string,
    @Body() input: GearCategoryInputDto,
  ) {
    return this.categories.update(principal.userId, categoryId, input);
  }

  @Post(':categoryId/archive')
  public archive(
    @CurrentUser() principal: SessionPrincipal,
    @Param('categoryId', new ParseUUIDPipe({ version: '4' }))
    categoryId: string,
  ) {
    return this.categories.archive(principal.userId, categoryId);
  }

  @Post('recommended')
  public recommended(@CurrentUser() principal: SessionPrincipal) {
    return this.categories.createRecommended(principal.userId);
  }
}
