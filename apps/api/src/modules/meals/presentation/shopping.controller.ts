import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { ShoppingGenerationService } from '../application/shopping-generation.service.js';
import { ShoppingService } from '../application/shopping.service.js';
import {
  CreateShoppingListDto,
  GenerateShoppingConfirmDto,
  GenerateShoppingPreviewDto,
  ShoppingItemInputDto,
  UpdateShoppingListDto,
} from './dto/shopping.dto.js';

@Controller('shopping-lists')
export class ShoppingListsController {
  public constructor(
    private readonly shopping: ShoppingService,
    private readonly generation: ShoppingGenerationService,
  ) {}

  @Get()
  public list(@CurrentUser() principal: SessionPrincipal) {
    return this.shopping.list(principal.userId);
  }

  @Post()
  public create(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: CreateShoppingListDto,
  ) {
    return this.shopping.create(principal.userId, input);
  }

  @Get(':listId')
  public detail(
    @CurrentUser() principal: SessionPrincipal,
    @Param('listId', new ParseUUIDPipe({ version: '4' })) listId: string,
  ) {
    return this.shopping.detail(principal.userId, listId);
  }

  @Patch(':listId')
  public update(
    @CurrentUser() principal: SessionPrincipal,
    @Param('listId', new ParseUUIDPipe({ version: '4' })) listId: string,
    @Body() input: UpdateShoppingListDto,
  ) {
    return this.shopping.update(principal.userId, listId, input);
  }

  @Post(':listId/complete')
  public complete(
    @CurrentUser() principal: SessionPrincipal,
    @Param('listId', new ParseUUIDPipe({ version: '4' })) listId: string,
  ) {
    return this.shopping.complete(principal.userId, listId);
  }

  @Post(':listId/items')
  public addItem(
    @CurrentUser() principal: SessionPrincipal,
    @Param('listId', new ParseUUIDPipe({ version: '4' })) listId: string,
    @Body() input: ShoppingItemInputDto,
  ) {
    return this.shopping.addItem(principal.userId, listId, input);
  }

  @Post(':listId/generate-preview')
  public preview(
    @CurrentUser() principal: SessionPrincipal,
    @Param('listId', new ParseUUIDPipe({ version: '4' })) listId: string,
    @Body() input: GenerateShoppingPreviewDto,
  ) {
    return this.generation.preview(principal.userId, listId, input);
  }

  @Post(':listId/generate-confirm')
  public confirm(
    @CurrentUser() principal: SessionPrincipal,
    @Param('listId', new ParseUUIDPipe({ version: '4' })) listId: string,
    @Body() input: GenerateShoppingConfirmDto,
  ) {
    return this.generation.confirm(principal.userId, listId, input);
  }
}

@Controller('shopping-list-items')
export class ShoppingListItemsController {
  public constructor(private readonly shopping: ShoppingService) {}

  @Patch(':itemId')
  public update(
    @CurrentUser() principal: SessionPrincipal,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
    @Body() input: ShoppingItemInputDto,
  ) {
    return this.shopping.updateItem(principal.userId, itemId, input);
  }

  @Delete(':itemId')
  public remove(
    @CurrentUser() principal: SessionPrincipal,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
  ) {
    return this.shopping.removeItem(principal.userId, itemId);
  }

  @Post(':itemId/check')
  public check(
    @CurrentUser() principal: SessionPrincipal,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
  ) {
    return this.shopping.setChecked(principal.userId, itemId, true);
  }

  @Post(':itemId/uncheck')
  public uncheck(
    @CurrentUser() principal: SessionPrincipal,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
  ) {
    return this.shopping.setChecked(principal.userId, itemId, false);
  }
}
