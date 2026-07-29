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
import { PantryService } from '../application/pantry.service.js';
import { PantryItemInputDto } from './dto/pantry.dto.js';

@Controller('pantry')
export class PantryController {
  public constructor(private readonly pantry: PantryService) {}

  @Get()
  public list(@CurrentUser() principal: SessionPrincipal) {
    return this.pantry.list(principal.userId);
  }

  @Post()
  public create(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: PantryItemInputDto,
  ) {
    return this.pantry.create(principal.userId, input);
  }

  @Patch(':itemId')
  public update(
    @CurrentUser() principal: SessionPrincipal,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
    @Body() input: PantryItemInputDto,
  ) {
    return this.pantry.update(principal.userId, itemId, input);
  }

  @Delete(':itemId')
  public remove(
    @CurrentUser() principal: SessionPrincipal,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
  ) {
    return this.pantry.remove(principal.userId, itemId);
  }
}
