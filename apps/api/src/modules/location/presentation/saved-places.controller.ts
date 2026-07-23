import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { SavedPlacesService } from '../application/places/saved-places.service.js';
import { CreateSavedPlaceDto } from './dto/create-saved-place.dto.js';

@Controller('locations/places')
export class SavedPlacesController {
  public constructor(private readonly places: SavedPlacesService) {}
  @Get() public list(@CurrentUser() principal: SessionPrincipal) {
    return this.places.list(principal.userId);
  }
  @Post() public create(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: CreateSavedPlaceDto,
  ) {
    return this.places.create(principal.userId, input);
  }
}
