import { Body, Controller, Header, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { SearchService } from '../application/search.service.js';
import { SearchRequestDto, type SearchResponseDto } from './dto/search.dto.js';

@Controller('search')
export class SearchController {
  public constructor(private readonly searchService: SearchService) {}

  @Post()
  @Header('Cache-Control', 'private, no-store')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  public search(
    @CurrentUser() principal: SessionPrincipal,
    @Body() request: SearchRequestDto,
  ): Promise<SearchResponseDto> {
    return this.searchService.search(principal.userId, request);
  }
}
