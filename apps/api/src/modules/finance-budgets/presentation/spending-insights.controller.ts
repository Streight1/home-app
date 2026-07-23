import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { SpendingInsightsService } from '../application/spending-insights.service.js';
import {
  ListInsightsQueryDto,
  RefreshInsightsDto,
} from './dto/insights.dto.js';

@Controller('finance/insights')
export class SpendingInsightsController {
  public constructor(private readonly insights: SpendingInsightsService) {}

  @Get()
  public list(
    @CurrentUser() principal: SessionPrincipal,
    @Query() query: ListInsightsQueryDto,
  ) {
    return this.insights.list(principal.userId, query);
  }

  @Post('refresh')
  public refresh(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: RefreshInsightsDto,
  ) {
    return this.insights.refresh(principal.userId, input);
  }

  @Post(':insightId/acknowledge')
  public acknowledge(
    @CurrentUser() principal: SessionPrincipal,
    @Param('insightId', new ParseUUIDPipe({ version: '4' })) insightId: string,
  ) {
    return this.insights.acknowledge(principal.userId, insightId);
  }

  @Post(':insightId/dismiss')
  public dismiss(
    @CurrentUser() principal: SessionPrincipal,
    @Param('insightId', new ParseUUIDPipe({ version: '4' })) insightId: string,
  ) {
    return this.insights.dismiss(principal.userId, insightId);
  }
}
