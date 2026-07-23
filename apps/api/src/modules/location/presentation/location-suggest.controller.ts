import { Controller, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { SuggestPlacesService } from '../application/places/suggest-places.service.js';
import { SuggestPlacesQueryDto } from './dto/suggest-places-query.dto.js';

@Controller('locations/suggest')
export class LocationSuggestController {
  public constructor(private readonly suggestions: SuggestPlacesService) {}
  @Get()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  public suggest(
    @CurrentUser() principal: SessionPrincipal,
    @Query() query: SuggestPlacesQueryDto,
  ) {
    return this.suggestions.execute(
      principal.userId,
      query.query,
      query.types.split(',').map((value) => value.trim()),
    );
  }
}
